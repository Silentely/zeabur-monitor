/**
 * 通知模块测试
 */

const {
  EVENTS,
  setWebhookConfigs,
  getWebhookConfigs,
  addWebhook,
  removeWebhook
} = require('../notifications');

describe('notifications', () => {
  beforeEach(() => {
    setWebhookConfigs([]);
  });

  describe('EVENTS', () => {
    it('应包含所有事件类型', () => {
      expect(EVENTS.QUOTA_WARNING).toBe('quota_warning');
      expect(EVENTS.QUOTA_EXCEEDED).toBe('quota_exceeded');
      expect(EVENTS.SERVICE_DOWN).toBe('service_down');
      expect(EVENTS.LOGIN_FAILED).toBe('login_failed');
      expect(EVENTS.ACCOUNT_ADDED).toBe('account_added');
      expect(EVENTS.ACCOUNT_REMOVED).toBe('account_removed');
    });
  });

  describe('webhook configs', () => {
    it('应能设置和获取配置', () => {
      const configs = [
        { id: '1', url: 'https://example.com/webhook', events: ['quota_warning'] }
      ];

      setWebhookConfigs(configs);
      expect(getWebhookConfigs()).toEqual(configs);
    });

    it('空配置应返回空数组', () => {
      setWebhookConfigs(null);
      expect(getWebhookConfigs()).toEqual([]);
    });
  });

  describe('addWebhook', () => {
    it('应添加 webhook 并返回 ID', () => {
      const id = addWebhook({
        url: 'https://example.com/webhook',
        name: 'Test Webhook'
      });

      expect(id).toBeDefined();
      expect(id.length).toBe(16);

      const configs = getWebhookConfigs();
      expect(configs.length).toBe(1);
      expect(configs[0].url).toBe('https://example.com/webhook');
    });
  });

  describe('removeWebhook', () => {
    it('应删除 webhook', () => {
      const id = addWebhook({ url: 'https://example.com/webhook' });
      expect(getWebhookConfigs().length).toBe(1);

      const result = removeWebhook(id);
      expect(result).toBe(true);
      expect(getWebhookConfigs().length).toBe(0);
    });

    it('删除不存在的 webhook 应返回 false', () => {
      const result = removeWebhook('nonexistent');
      expect(result).toBe(false);
    });
  });
});
