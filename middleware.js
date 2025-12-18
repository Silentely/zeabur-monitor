/**
 * 中间件模块
 * 包含限流、输入验证等安全中间件
 */

const rateLimit = require('express-rate-limit');
const { body, param, validationResult } = require('express-validator');

// ==================== 限流配置 ====================

/**
 * 通用 API 限流
 * 每个 IP 每分钟最多 100 次请求
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 100,
  message: { error: '请求过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * 登录限流（严格）
 * 每个 IP 每 15 分钟最多 5 次尝试
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5,
  message: { error: '登录尝试次数过多，请 15 分钟后再试' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // 成功的请求不计入限制
});

/**
 * 密码设置限流
 * 每个 IP 每小时最多 3 次
 */
const passwordSetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 3,
  message: { error: '密码设置次数过多，请 1 小时后再试' },
  standardHeaders: true,
  legacyHeaders: false
});

// ==================== 输入验证规则 ====================

/**
 * 验证结果处理中间件
 */
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: '输入验证失败',
      details: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
};

/**
 * 密码验证规则
 */
const validatePassword = [
  body('password')
    .isString().withMessage('密码必须是字符串')
    .isLength({ min: 6, max: 128 }).withMessage('密码长度必须在 6-128 位之间')
    .matches(/^[\x20-\x7E]+$/).withMessage('密码只能包含可打印 ASCII 字符'),
  handleValidation
];

/**
 * 账号验证规则
 */
const validateAccount = [
  body('accountName')
    .optional()
    .isString().withMessage('账号名称必须是字符串')
    .isLength({ min: 1, max: 50 }).withMessage('账号名称长度必须在 1-50 位之间')
    .trim()
    .escape(),
  body('apiToken')
    .optional()
    .isString().withMessage('API Token 必须是字符串')
    .matches(/^sk-[a-zA-Z0-9]+$/).withMessage('API Token 格式无效'),
  handleValidation
];

/**
 * 账号列表验证规则
 */
const validateAccounts = [
  body('accounts')
    .isArray().withMessage('账号列表必须是数组')
    .custom((accounts) => {
      if (accounts.length > 100) {
        throw new Error('账号数量不能超过 100 个');
      }
      for (const acc of accounts) {
        if (!acc.name || typeof acc.name !== 'string') {
          throw new Error('每个账号必须有名称');
        }
        if (!acc.token || typeof acc.token !== 'string') {
          throw new Error('每个账号必须有 Token');
        }
        if (acc.name.length > 50) {
          throw new Error('账号名称不能超过 50 个字符');
        }
      }
      return true;
    }),
  handleValidation
];

/**
 * 索引参数验证
 */
const validateIndex = [
  param('index')
    .isInt({ min: 0, max: 999 }).withMessage('索引必须是 0-999 的整数'),
  handleValidation
];

/**
 * 项目重命名验证
 */
const validateRename = [
  body('accountId')
    .isString().withMessage('账号 ID 必须是字符串')
    .isLength({ min: 1, max: 100 }).withMessage('账号 ID 长度无效'),
  body('projectId')
    .isString().withMessage('项目 ID 必须是字符串')
    .isLength({ min: 1, max: 100 }).withMessage('项目 ID 长度无效'),
  body('newName')
    .isString().withMessage('新名称必须是字符串')
    .isLength({ min: 1, max: 50 }).withMessage('新名称长度必须在 1-50 位之间')
    .trim(),
  handleValidation
];

/**
 * 服务操作验证
 */
const validateServiceAction = [
  body('token')
    .isString().withMessage('Token 必须是字符串'),
  body('serviceId')
    .isString().withMessage('服务 ID 必须是字符串'),
  body('environmentId')
    .isString().withMessage('环境 ID 必须是字符串'),
  handleValidation
];

/**
 * 日志查询验证
 */
const validateLogsQuery = [
  body('token')
    .isString().withMessage('Token 必须是字符串'),
  body('serviceId')
    .isString().withMessage('服务 ID 必须是字符串'),
  body('environmentId')
    .isString().withMessage('环境 ID 必须是字符串'),
  body('projectId')
    .isString().withMessage('项目 ID 必须是字符串'),
  body('limit')
    .optional()
    .isInt({ min: 1, max: 1000 }).withMessage('日志条数限制必须在 1-1000 之间'),
  handleValidation
];

/**
 * Webhook 配置验证
 */
const validateWebhook = [
  body('url')
    .isURL({ protocols: ['http', 'https'] }).withMessage('Webhook URL 格式无效'),
  body('events')
    .optional()
    .isArray().withMessage('事件列表必须是数组'),
  body('secret')
    .optional()
    .isString().isLength({ max: 256 }).withMessage('密钥长度不能超过 256'),
  handleValidation
];

module.exports = {
  // 限流器
  apiLimiter,
  loginLimiter,
  passwordSetLimiter,
  // 验证器
  validatePassword,
  validateAccount,
  validateAccounts,
  validateIndex,
  validateRename,
  validateServiceAction,
  validateLogsQuery,
  validateWebhook,
  handleValidation
};
