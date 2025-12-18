/**
 * 数据库存储模块
 * 支持 PostgreSQL 持久化存储（可选）
 * 当配置 DATABASE_URL 时启用，否则回退到文件存储
 */

const fs = require('fs');
const path = require('path');

// 数据库连接池
let pool = null;
let isDbEnabled = false;

// 文件存储路径
const ACCOUNTS_FILE = path.join(__dirname, 'accounts.json');
const PASSWORD_FILE = path.join(__dirname, 'password.json');

/**
 * 初始化数据库连接
 */
async function initDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.log('📁 存储模式: 文件存储');
    return false;
  }

  try {
    const { Pool } = require('pg');
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false }
    });

    // 测试连接
    await pool.query('SELECT 1');

    // 创建表
    await createTables();

    isDbEnabled = true;
    console.log('🐘 存储模式: PostgreSQL');
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL 连接失败:', error.message);
    console.log('📁 回退到文件存储模式');
    pool = null;
    return false;
  }
}

/**
 * 创建数据库表
 */
async function createTables() {
  // 账号表
  await pool.query(`
    CREATE TABLE IF NOT EXISTS accounts (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      token TEXT,
      encrypted_token JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 配置表（存储密码等）
  await pool.query(`
    CREATE TABLE IF NOT EXISTS config (
      key VARCHAR(255) PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('✅ 数据库表已就绪');
}

/**
 * 检查是否启用数据库
 */
function isDatabaseEnabled() {
  return isDbEnabled && pool !== null;
}

/**
 * 读取账号列表
 */
async function loadAccounts(encryptionEnabled, decryptFn, secret) {
  if (isDatabaseEnabled()) {
    try {
      const result = await pool.query(
        'SELECT name, token, encrypted_token FROM accounts ORDER BY id'
      );

      return result.rows.map(row => {
        if (encryptionEnabled && row.encrypted_token) {
          try {
            const token = decryptFn(row.encrypted_token, secret);
            return { name: row.name, token };
          } catch (e) {
            console.error(`❌ 解密账号 [${row.name}] 失败:`, e.message);
            return { name: row.name, token: row.token };
          }
        }
        return { name: row.name, token: row.token };
      });
    } catch (error) {
      console.error('❌ 从数据库读取账号失败:', error.message);
      return [];
    }
  }

  // 文件存储
  try {
    if (fs.existsSync(ACCOUNTS_FILE)) {
      const data = fs.readFileSync(ACCOUNTS_FILE, 'utf8');
      const accounts = JSON.parse(data);

      if (encryptionEnabled) {
        return accounts.map(account => {
          if (account.encryptedToken) {
            try {
              const token = decryptFn(account.encryptedToken, secret);
              return { ...account, token, encryptedToken: undefined };
            } catch (e) {
              console.error(`❌ 解密账号 [${account.name}] 失败:`, e.message);
              return account;
            }
          }
          return account;
        });
      }

      return accounts;
    }
  } catch (e) {
    console.error('❌ 读取账号文件失败:', e.message);
  }
  return [];
}

/**
 * 保存账号列表
 */
async function saveAccounts(accounts, encryptionEnabled, encryptFn, secret) {
  if (isDatabaseEnabled()) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 清空现有账号
      await client.query('DELETE FROM accounts');

      // 插入新账号
      for (const account of accounts) {
        if (encryptionEnabled && account.token) {
          try {
            const encryptedToken = encryptFn(account.token, secret);
            await client.query(
              'INSERT INTO accounts (name, encrypted_token) VALUES ($1, $2)',
              [account.name, encryptedToken]
            );
          } catch (e) {
            console.error(`❌ 加密账号 [${account.name}] 失败:`, e.message);
            await client.query(
              'INSERT INTO accounts (name, token) VALUES ($1, $2)',
              [account.name, account.token]
            );
          }
        } else {
          await client.query(
            'INSERT INTO accounts (name, token) VALUES ($1, $2)',
            [account.name, account.token]
          );
        }
      }

      await client.query('COMMIT');
      if (encryptionEnabled) {
        console.log('🔐 账号 Token 已加密存储到数据库');
      }
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ 保存账号到数据库失败:', error.message);
      return false;
    } finally {
      client.release();
    }
  }

  // 文件存储
  try {
    let accountsToSave = accounts;

    if (encryptionEnabled) {
      accountsToSave = accounts.map(account => {
        if (account.token) {
          try {
            const encryptedToken = encryptFn(account.token, secret);
            const { token, ...rest } = account;
            return { ...rest, encryptedToken };
          } catch (e) {
            console.error(`❌ 加密账号 [${account.name}] 失败:`, e.message);
            return account;
          }
        }
        return account;
      });
      console.log('🔐 账号 Token 已加密存储');
    }

    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accountsToSave, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('❌ 保存账号文件失败:', e.message);
    return false;
  }
}

/**
 * 读取管理员密码
 */
async function loadPassword() {
  if (isDatabaseEnabled()) {
    try {
      const result = await pool.query(
        "SELECT value FROM config WHERE key = 'admin_password'"
      );
      return result.rows[0]?.value || null;
    } catch (error) {
      console.error('❌ 从数据库读取密码失败:', error.message);
      return null;
    }
  }

  // 文件存储
  try {
    if (fs.existsSync(PASSWORD_FILE)) {
      const data = fs.readFileSync(PASSWORD_FILE, 'utf8');
      return JSON.parse(data).password;
    }
  } catch (e) {
    console.error('❌ 读取密码文件失败:', e.message);
  }
  return null;
}

/**
 * 保存管理员密码
 */
async function savePassword(password) {
  if (isDatabaseEnabled()) {
    try {
      await pool.query(`
        INSERT INTO config (key, value, updated_at)
        VALUES ('admin_password', $1, CURRENT_TIMESTAMP)
        ON CONFLICT (key)
        DO UPDATE SET value = $1, updated_at = CURRENT_TIMESTAMP
      `, [password]);
      return true;
    } catch (error) {
      console.error('❌ 保存密码到数据库失败:', error.message);
      return false;
    }
  }

  // 文件存储
  try {
    fs.writeFileSync(PASSWORD_FILE, JSON.stringify({ password }, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('❌ 保存密码文件失败:', e.message);
    return false;
  }
}

/**
 * 关闭数据库连接
 */
async function closeDatabase() {
  if (pool) {
    await pool.end();
    pool = null;
    isDbEnabled = false;
  }
}

module.exports = {
  initDatabase,
  isDatabaseEnabled,
  loadAccounts,
  saveAccounts,
  loadPassword,
  savePassword,
  closeDatabase
};
