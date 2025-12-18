/**
 * 密码工具模块
 * 使用 bcrypt 进行密码哈希和验证
 */

const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;

/**
 * 哈希密码
 * @param {string} password - 明文密码
 * @returns {Promise<string>} 哈希后的密码
 */
async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * 验证密码
 * @param {string} password - 明文密码
 * @param {string} hash - 哈希后的密码
 * @returns {Promise<boolean>} 是否匹配
 */
async function verifyPassword(password, hash) {
  // 兼容旧版明文密码（迁移期）
  if (!hash.startsWith('$2')) {
    return password === hash;
  }
  return await bcrypt.compare(password, hash);
}

/**
 * 检查是否为哈希格式
 * @param {string} password - 密码字符串
 * @returns {boolean}
 */
function isHashed(password) {
  if (!password || typeof password !== 'string') {
    return false;
  }
  return password.startsWith('$2');
}

module.exports = {
  hashPassword,
  verifyPassword,
  isHashed
};
