# DevOps 管理平台

一个功能强大的 DevOps 管理平台，支持服务器管理、Docker 容器部署、GitLab CI/CD 集成、Nginx 代理配置等功能。

## 功能特性

### 服务器管理
- 支持多服务器管理（Windows/Linux）
- SSH 远程连接和命令执行
- 文件上传/下载/管理
- 服务器状态监控

### Docker 管理
- Docker 容器创建、启动、停止、重启、删除
- Docker 镜像管理和拉取
- 支持从 GitLab 构建产物运行容器
- 端口映射和环境变量配置
- Nginx 代理配置集成

### GitLab 集成
- GitLab 项目和分支管理
- CI/CD Pipeline 触发和监控
- 构建产物下载和部署
- Webhook 自动触发构建

### Nginx 管理
- Nginx 状态监控
- 站点配置管理
- 代理配置（支持文本格式）
- Nginx 安装和配置

### PM2 进程管理
- PM2 进程列表查看
- 进程启动、停止、重启
- 资源使用监控（CPU、内存）

### 项目运行
- 统一查看所有运行中的项目（PM2 + Docker）
- 一键重启/停止
- 访问链接快速跳转

### 监控告警
- 服务器资源监控
- 自定义告警配置
- 企业微信通知支持

## 技术栈

### 前端
- **框架**: Nuxt.js 4.x (Vue 3)
- **UI**: Element Plus + Tailwind CSS
- **状态管理**: Pinia
- **工具库**: @vueuse/core

### 后端
- **运行时**: Node.js
- **SSH**: ssh2, ssh2-sftp-client
- **GitLab API**: @gitbeaker/rest
- **验证**: zod
- **编码**: iconv-lite（Windows GBK 支持）

## 安装和运行

### 环境要求
- Node.js >= 18
- npm / pnpm / yarn / bun

### 安装依赖

```bash
npm install
```

### 配置环境变量

复制 `.env.example` 为 `.env` 并配置：

```env
# GitLab 配置
GITLAB_URL=https://gitlab.example.com
GITLAB_TOKEN=your_private_token

# 企业微信通知（可选）
WECHAT_WEBHOOK=https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:3000

### 生产构建

```bash
npm run build
npm run preview
```

## 使用指南

### 1. 添加服务器

在「服务器配置」页面添加服务器信息：
- 服务器名称
- SSH 连接信息（主机、端口、用户名、密码/密钥）
- 操作系统类型（Windows/Linux）
- 工作目录

### 2. 配置 GitLab

在「GitLab 配置」页面：
- 输入 GitLab URL 和访问令牌
- 测试连接
- 查看可用项目和分支

### 3. Docker 运行项目

#### 方式一：使用镜像运行
1. 点击「Docker 运行」按钮
2. 选择服务器
3. 选择或输入镜像名称
4. 配置端口映射、环境变量
5. （可选）配置 Nginx 代理

#### 方式二：使用 GitLab 构建产物运行
1. 选择 GitLab 项目和分支
2. 选择构建产物
3. 选择运行镜像（可选）
4. 配置容器参数
5. （可选）配置 Nginx 代理

### 4. 管理运行中的项目

在「项目运行」页面：
- 查看所有运行中的项目（PM2 和 Docker）
- 查看资源使用情况
- 一键重启/停止
- 点击「访问」链接快速访问应用

### 5. Nginx 代理配置

创建容器时可以配置 Nginx 代理：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 项目结构

```
frontend/
├── components/          # Vue 组件
│   ├── DockerRunModal.vue
│   ├── ImageSelectModal.vue
│   └── ...
├── pages/              # 页面
│   ├── server/         # 服务器详情
│   ├── builds.vue      # 构建管理
│   ├── projects.vue    # 项目管理
│   ├── run.vue         # 项目运行
│   └── ...
├── server/             # 后端 API
│   ├── api/            # API 路由
│   │   ├── docker/     # Docker 相关
│   │   ├── gitlab/     # GitLab 相关
│   │   ├── nginx/      # Nginx 相关
│   │   └── ...
│   └── utils/          # 工具函数
├── stores/             # Pinia 状态管理
├── types/              # TypeScript 类型定义
└── data/               # 数据存储
```

## 常见问题

### 1. Docker 镜像拉取失败
- 检查服务器网络连接
- 确认镜像名称正确
- 检查 Docker 服务是否运行

### 2. SSH 连接失败
- 确认 SSH 服务已启动
- 检查防火墙设置
- 验证用户名和密码/密钥

### 3. Nginx 配置不生效
- 检查 Nginx 配置文件路径
- 确认 Nginx 已重新加载
- 检查配置文件语法

### 4. Windows 中文乱码
- 系统已集成 iconv-lite 进行 GBK 编码转换
- 确保 SSH 连接使用正确的编码

## 开发说明

### 添加新的 API 端点

在 `server/api/` 下创建对应的文件：

```typescript
// server/api/example.get.ts
export default defineEventHandler(async (event) => {
  return { message: 'Hello World' }
})
```

### 添加新的页面

在 `pages/` 下创建 `.vue` 文件：

```vue
<template>
  <div>
    <h1>新页面</h1>
  </div>
</template>
```

### 使用 SSH 连接

```typescript
import { createSshHandle } from '~/server/utils/ssh'

const ssh = await createSshHandle(server)
try {
  const { stdout, stderr, code } = await ssh.exec('ls -la')
} finally {
  ssh.dispose()
}
```

## License

MIT
