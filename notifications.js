/**
 * 告警通知模块
 * 支持 Webhook、邮件等通知方式
 */

const https = require('https');
const http = require('http');
const crypto = require('crypto');

// 通知事件类型
const EVENTS = {
  QUOTA_WARNING: 'quota_warning',      // 额度预警
  QUOTA_EXCEEDED: 'quota_exceeded',    // 额度超出
  SERVICE_DOWN: 'service_down',        // 服务停止
  SERVICE_ERROR: 'service_error',      // 服务错误
  LOGIN_FAILED: 'login_failed',        // 登录失败
  ACCOUNT_ADDED: 'account_added',      // 账号添加
  ACCOUNT_REMOVED: 'account_removed'   // 账号删除
};

// Webhook 配置存储
let webhookConfigs = [];

/**
 * 设置 Webhook 配置
 * @param {Array} configs - Webhook 配置数组
 */
function setWebhookConfigs(configs) {
  webhookConfigs = configs || [];
}

/**
 * 获取 Webhook 配置
 */
function getWebhookConfigs() {
  return webhookConfigs;
}

/**
 * 添加 Webhook
 * @param {object} config - { url, events, secret, name }
 */
function addWebhook(config) {
  const id = crypto.randomBytes(8).toString('hex');
  webhookConfigs.push({ id, ...config, createdAt: Date.now() });
  return id;
}

/**
 * 删除 Webhook
 * @param {string} id - Webhook ID
 */
function removeWebhook(id) {
  const index = webhookConfigs.findIndex(w => w.id === id);
  if (index !== -1) {
    webhookConfigs.splice(index, 1);
    return true;
  }
  return false;
}

/**
 * 生成签名
 * @param {string} payload - 请求体
 * @param {string} secret - 密钥
 */
function generateSignature(payload, secret) {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * 发送 Webhook 通知
 * @param {string} event - 事件类型
 * @param {object} data - 事件数据
 */
async function sendWebhook(event, data) {
  const payload = JSON.stringify({
    event,
    timestamp: new Date().toISOString(),
    data
  });

  const results = await Promise.allSettled(
    webhookConfigs
      .filter(config => !config.events || config.events.includes(event))
      .map(config => sendToWebhook(config, payload))
  );

  const success = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  if (failed > 0) {
    console.log(`⚠️ Webhook 通知: ${success} 成功, ${failed} 失败`);
  }

  return { success, failed };
}

/**
 * 发送到单个 Webhook
 */
function sendToWebhook(config, payload) {
  return new Promise((resolve, reject) => {
    const url = new URL(config.url);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
      'User-Agent': 'Zeabur-Monitor-Webhook/2.0',
      'X-Webhook-Event': payload.event
    };

    // 添加签名
    if (config.secret) {
      headers['X-Webhook-Signature'] = generateSignature(payload, config.secret);
    }

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: 'POST',
      headers,
      timeout: 10000
    };

    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ status: res.statusCode, body });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Webhook 请求超时'));
    });

    req.write(payload);
    req.end();
  });
}

/**
 * 发送额度预警
 * @param {string} accountName - 账号名称
 * @param {number} remaining - 剩余额度
 * @param {number} threshold - 阈值
 */
async function notifyQuotaWarning(accountName, remaining, threshold) {
  return sendWebhook(EVENTS.QUOTA_WARNING, {
    accountName,
    remaining: `$${remaining.toFixed(2)}`,
    threshold: `$${threshold.toFixed(2)}`,
    message: `账号 ${accountName} 剩余额度 $${remaining.toFixed(2)}，低于阈值 $${threshold.toFixed(2)}`
  });
}

/**
 * 发送服务停止通知
 * @param {string} accountName - 账号名称
 * @param {string} serviceName - 服务名称
 * @param {string} projectName - 项目名称
 */
async function notifyServiceDown(accountName, serviceName, projectName) {
  return sendWebhook(EVENTS.SERVICE_DOWN, {
    accountName,
    serviceName,
    projectName,
    message: `服务 ${serviceName} (${projectName}) 已停止运行`
  });
}

/**
 * 发送登录失败通知
 * @param {string} ip - IP 地址
 * @param {number} attempts - 尝试次数
 */
async function notifyLoginFailed(ip, attempts) {
  return sendWebhook(EVENTS.LOGIN_FAILED, {
    ip,
    attempts,
    message: `IP ${ip} 登录失败 ${attempts} 次`
  });
}

/**
 * 测试 Webhook
 * @param {string} url - Webhook URL
 * @param {string} secret - 可选密钥
 */
async function testWebhook(url, secret) {
  const config = { url, secret };
  const payload = JSON.stringify({
    event: 'test',
    timestamp: new Date().toISOString(),
    data: { message: '这是一条测试消息' }
  });

  try {
    const result = await sendToWebhook(config, payload);
    return { success: true, ...result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = {
  EVENTS,
  setWebhookConfigs,
  getWebhookConfigs,
  addWebhook,
  removeWebhook,
  sendWebhook,
  notifyQuotaWarning,
  notifyServiceDown,
  notifyLoginFailed,
  testWebhook
};
