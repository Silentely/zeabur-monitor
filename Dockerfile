# 基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制依赖配置
COPY package*.json ./

# 安装生产依赖
RUN npm ci --only=production

# 复制应用代码
COPY . .

# 创建数据目录
RUN mkdir -p /app/data

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# 启动应用
CMD ["node", "server.js"]
