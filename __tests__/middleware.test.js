/**
 * 中间件模块测试
 */

const express = require('express');
const request = require('supertest');
const { apiLimiter, loginLimiter, validatePassword, handleValidation } = require('../middleware');

describe('middleware', () => {
  describe('validatePassword', () => {
    let app;

    beforeEach(() => {
      app = express();
      app.use(express.json());
      app.post('/test', validatePassword, (req, res) => {
        res.json({ success: true });
      });
    });

    it('有效密码应通过验证', async () => {
      const res = await request(app)
        .post('/test')
        .send({ password: 'validpass123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('密码太短应返回错误', async () => {
      const res = await request(app)
        .post('/test')
        .send({ password: '12345' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('输入验证失败');
    });

    it('密码太长应返回错误', async () => {
      const res = await request(app)
        .post('/test')
        .send({ password: 'a'.repeat(129) });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('输入验证失败');
    });

    it('缺少密码应返回错误', async () => {
      const res = await request(app)
        .post('/test')
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('apiLimiter', () => {
    it('应该是一个中间件函数', () => {
      expect(typeof apiLimiter).toBe('function');
    });
  });

  describe('loginLimiter', () => {
    it('应该是一个中间件函数', () => {
      expect(typeof loginLimiter).toBe('function');
    });
  });
});
