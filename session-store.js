/**
 * Session 管理模块
 * 支持内存存储和 Redis 持久化
 */

const crypto = require('crypto');

// Session 配置
const SESSION_DURATION = 10 * 24 * 60 * 60 * 1000; // 10天
const SESSION_PREFIX = 'session:';

// 存储后端
let redisClient = null;
let isRedisEnabled = false;
const memorySessions = new Map();

/**
 * 初始化 Session 存储
 */
async function initSessionStore() {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    console.log('📝 Session 存储: 内存');
    return false;
  }

  try {
    const Redis = require('ioredis');
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100
    });

    await redisClient.ping();
    isRedisEnabled = true;
    console.log('🔴 Session 存储: Redis');
    return true;
  } catch (error) {
    console.error('❌ Redis 连接失败:', error.message);
    console.log('📝 回退到内存存储');
    redisClient = null;
    return false;
  }
}

/**
 * 生成 Session Token
 */
function generateSessionToken() {
  return 'session_' + crypto.randomBytes(32).toString('hex');
}

/**
 * 创建 Session
 * @param {string} userId - 用户ID（可选，用于多用户）
 * @returns {Promise<string>} Session Token
 */
async function createSession(userId = 'admin') {
  const token = generateSessionToken();
  const session = {
    userId,
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_DURATION
  };

  if (isRedisEnabled && redisClient) {
    await redisClient.setex(
      SESSION_PREFIX + token,
      Math.floor(SESSION_DURATION / 1000),
      JSON.stringify(session)
    );
  } else {
    memorySessions.set(token, session);
  }

  return token;
}

/**
 * 验证 Session
 * @param {string} token - Session Token
 * @returns {Promise<object|null>} Session 数据或 null
 */
async function validateSession(token) {
  if (!token) return null;

  let session = null;

  if (isRedisEnabled && redisClient) {
    const data = await redisClient.get(SESSION_PREFIX + token);
    if (data) {
      session = JSON.parse(data);
    }
  } else {
    session = memorySessions.get(token);
  }

  if (!session) return null;

  // 检查是否过期
  if (Date.now() > session.expiresAt) {
    await destroySession(token);
    return null;
  }

  return session;
}

/**
 * 销毁 Session
 * @param {string} token - Session Token
 */
async function destroySession(token) {
  if (isRedisEnabled && redisClient) {
    await redisClient.del(SESSION_PREFIX + token);
  } else {
    memorySessions.delete(token);
  }
}

/**
 * 清理过期 Session（仅内存模式）
 */
function cleanExpiredSessions() {
  if (isRedisEnabled) return; // Redis 自动过期

  const now = Date.now();
  for (const [token, session] of memorySessions.entries()) {
    if (now > session.expiresAt) {
      memorySessions.delete(token);
    }
  }
}

/**
 * 获取活跃 Session 数量
 */
async function getActiveSessionCount() {
  if (isRedisEnabled && redisClient) {
    const keys = await redisClient.keys(SESSION_PREFIX + '*');
    return keys.length;
  }
  return memorySessions.size;
}

/**
 * 关闭 Redis 连接
 */
async function closeSessionStore() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    isRedisEnabled = false;
  }
}

/**
 * 检查是否使用 Redis
 */
function isRedisSessionEnabled() {
  return isRedisEnabled;
}

// 每小时清理过期 Session（内存模式）
setInterval(cleanExpiredSessions, 60 * 60 * 1000);

module.exports = {
  initSessionStore,
  generateSessionToken,
  createSession,
  validateSession,
  destroySession,
  cleanExpiredSessions,
  getActiveSessionCount,
  closeSessionStore,
  isRedisSessionEnabled
};
