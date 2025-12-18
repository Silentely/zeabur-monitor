/**
 * 密码工具模块测试
 */

const { hashPassword, verifyPassword, isHashed } = require('../password-utils');

describe('password-utils', () => {
  describe('hashPassword', () => {
    it('应该生成 bcrypt 哈希', async () => {
      const password = 'testpassword123';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).toMatch(/^\$2[aby]\$/);
      expect(hash.length).toBeGreaterThan(50);
    });

    it('相同密码应生成不同哈希', async () => {
      const password = 'testpassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('正确密码应验证成功', async () => {
      const password = 'testpassword123';
      const hash = await hashPassword(password);

      const result = await verifyPassword(password, hash);
      expect(result).toBe(true);
    });

    it('错误密码应验证失败', async () => {
      const password = 'testpassword123';
      const hash = await hashPassword(password);

      const result = await verifyPassword('wrongpassword', hash);
      expect(result).toBe(false);
    });

    it('应兼容明文密码（迁移期）', async () => {
      const password = 'plaintext123';

      const result = await verifyPassword(password, password);
      expect(result).toBe(true);
    });
  });

  describe('isHashed', () => {
    it('应识别 bcrypt 哈希', async () => {
      const hash = await hashPassword('test');
      expect(isHashed(hash)).toBe(true);
    });

    it('应识别明文密码', () => {
      expect(isHashed('plaintext')).toBe(false);
      expect(isHashed('short')).toBe(false);
    });

    it('应处理空值', () => {
      expect(isHashed(null)).toBe(false);
      expect(isHashed(undefined)).toBe(false);
      expect(isHashed('')).toBe(false);
    });
  });
});
