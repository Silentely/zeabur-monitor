# Stage 1: 构建前端
FROM node:18-alpine AS builder
WORKDIR /app

# 优化缓存：先复制 package 文件
COPY client/package*.json ./client/

# 安装前端依赖
WORKDIR /app/client
RUN npm ci

# 复制前端源码并构建
COPY client/ ./
RUN npm run build

# Stage 2: 生产环境
FROM node:18-alpine
WORKDIR /app

# 创建非 root 用户
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# 优化缓存：先复制 package 文件
COPY package*.json ./

# 安装后端生产依赖
RUN npm ci --omit=dev && npm cache clean --force

# 显式复制后端代码（避免通配符风险）
COPY server.js ./
COPY db.js ./
COPY cache.js ./
COPY crypto-utils.js ./
COPY middleware.js ./
COPY notifications.js ./
COPY password-utils.js ./
COPY redis-client.js ./
COPY session-store.js ./

# 从 Stage 1 复制构建好的前端静态资源
COPY --from=builder /app/client/dist ./client/dist

# 创建数据目录并设置权限
RUN mkdir -p /app/data && chown -R appuser:appgroup /app

# 切换到非 root 用户
USER appuser

ENV NODE_ENV=production
EXPOSE 3000

# 健康检查（使用 node 实现，避免 wget 依赖问题）
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/version', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "server.js"]
