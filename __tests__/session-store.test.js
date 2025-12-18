/**
 * Session 存储模块测试
 */

const {
  generateSessionToken,
  createSession,
  validateSession,
  destroySession,
  cleanExpiredSessions,
  getActiveSessionCount
} = require('../session-store');

describe('session-store', () => {
  describe('generateSessionToken', () => {
    it('应生成唯一的 token', () => {
      const token1 = generateSessionToken();
      const token2 = generateSessionToken();

      expect(token1).not.toBe(token2);
      expect(token1).toMatch(/^session_/);
      expect(token1.length).toBeGreaterThan(20);
    });
  });

  describe('createSession', () => {
    it('应创建 session 并返回 token', async () => {
      const token = await createSession();

      expect(token).toBeDefined();
      expect(token).toMatch(/^session_/);
    });

    it('应支持自定义 userId', async () => {
      const token = await createSession('user123');
      const session = await validateSession(token);

      expect(session).toBeDefined();
      expect(session.userId).toBe('user123');
    });
  });

  describe('validateSession', () => {
    it('有效 session 应返回 session 数据', async () => {
      const token = await createSession('testuser');
      const session = await validateSession(token);

      expect(session).toBeDefined();
      expect(session.userId).toBe('testuser');
      expect(session.createdAt).toBeDefined();
      expect(session.expiresAt).toBeDefined();
    });

    it('无效 token 应返回 null', async () => {
      const session = await validateSession('invalid_token');
      expect(session).toBeNull();
    });

    it('空 token 应返回 null', async () => {
      expect(await validateSession(null)).toBeNull();
      expect(await validateSession(undefined)).toBeNull();
      expect(await validateSession('')).toBeNull();
    });
  });

  describe('destroySession', () => {
    it('应销毁 session', async () => {
      const token = await createSession();

      // 验证 session 存在
      let session = await validateSession(token);
      expect(session).toBeDefined();

      // 销毁
      await destroySession(token);

      // 验证已销毁
      session = await validateSession(token);
      expect(session).toBeNull();
    });
  });

  describe('getActiveSessionCount', () => {
    it('应返回活跃 session 数量', async () => {
      const initialCount = await getActiveSessionCount();

      await createSession();
      await createSession();

      const newCount = await getActiveSessionCount();
      expect(newCount).toBeGreaterThanOrEqual(initialCount + 2);
    });
  });

  describe('cleanExpiredSessions', () => {
    it('应该是一个函数', () => {
      expect(typeof cleanExpiredSessions).toBe('function');
    });
  });
});
