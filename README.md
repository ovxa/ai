# AI Trio Chat - 三 AI 协作助手

一个支持与三个专业 AI 助手协作的聊天应用，具有完整的 @mention 系统。

## 功能特性

### @Mention 系统
- **@analyst** - 向分析者 Claude 发送消息（逻辑分析专家）
- **@creator** - 向创意者 GPT 发送消息（创新方案专家）
- **@evaluator** - 向评估者 Gemini 发送消息（风险评估专家）
- **@all** - 同时向所有 AI 发送消息
- **无 @** - 按默认协作模式（三个 AI 依次回答）

### 交互特性
- 智能自动补全：输入 `@` 显示 AI 选择菜单
- 键盘导航：使用 ↑↓ 选择，Enter 确认，Esc 关闭
- 实时状态显示：在线/离线/正在输入/错误状态
- 视觉反馈：被提及的 AI 卡片高亮，未提及的半透明
- 响应式设计：支持桌面、平板、移动端

## 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **状态管理**: Zustand
- **AI API**: OpenRouter (支持多个 AI 模型)

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env` 文件（参考 `.env.example`）：

```bash
NEXT_PUBLIC_OPENROUTER_API_KEY=your_api_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=AI Trio Chat
```

获取 OpenRouter API Key：https://openrouter.ai/

### 3. 运行开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 4. 构建生产版本

```bash
npm run build
npm start
```

## 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── api/chat/          # API 路由
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 主页
├── components/            # React 组件
│   ├── AIAgentCard.tsx    # AI 卡片显示
│   ├── ChatInput.tsx      # 聊天输入框
│   ├── ChatInterface.tsx  # 主界面
│   ├── MentionAutocomplete.tsx  # @mention 自动补全
│   └── MessageList.tsx    # 消息列表
├── lib/                   # 库和配置
│   ├── agents.ts          # AI Agent 配置
│   └── store.ts           # Zustand 状态管理
├── types/                 # TypeScript 类型定义
│   └── index.ts
└── utils/                 # 工具函数
    └── mention.ts         # @mention 解析逻辑
```

## 使用指南

### 基本对话

1. 在输入框中输入消息
2. 按 Enter 发送（Shift+Enter 换行）
3. 默认情况下，三个 AI 会依次回复

### 使用 @Mention

1. **提及单个 AI**：
   ```
   @analyst 分析这个问题的关键因素
   ```

2. **提及多个 AI**：
   ```
   @analyst @creator 如何优化这个方案？
   ```

3. **提及所有 AI**：
   ```
   @all 你们对这个想法有什么看法？
   ```

4. **使用自动补全**：
   - 输入 `@` 自动显示选择菜单
   - 使用 ↑↓ 键导航
   - 按 Enter 选择
   - 按 Esc 关闭

### AI Agent 介绍

- **分析者 Claude** (蓝色)
  - 擅长逻辑分析和信息提取
  - 提供结构化的问题分析
  - 识别关键因素和潜在挑战

- **创意者 GPT** (紫色)
  - 擅长创新方案和头脑风暴
  - 提供多种创意解决方案
  - 突破常规思维

- **评估者 Gemini** (绿色)
  - 擅长方案评估和风险分析
  - 评估可行性和潜在风险
  - 提供建设性改进建议

## 开发命令

```bash
# 开发模式
npm run dev

# 类型检查
npm run type-check

# 构建
npm run build

# 生产模式
npm start

# 代码检查
npm run lint
```

## 自定义配置

### 修改 AI Agent 配置

编辑 `src/lib/agents.ts` 来自定义：
- AI 名称和角色
- System prompts
- 使用的模型
- 颜色主题

### 修改样式

编辑 `tailwind.config.js` 来自定义：
- 颜色方案
- 动画效果
- 响应式断点

## 功能清单

根据 `plan-mention.md` 的要求：

### 核心功能
- [x] @ 字符触发自动补全
- [x] 自动补全显示所有可用 AI + @all 选项
- [x] 键盘导航(↑↓ Enter Esc)
- [x] 鼠标点击选择
- [x] 支持模糊搜索(输入部分名称)
- [x] 大小写不敏感

### 消息路由
- [x] @analyst 仅向 analyst 发送
- [x] @analyst @creator 向两者发送
- [x] @all 向所有 AI 发送
- [x] 无 @ 按默认流程(sequential)
- [x] 并行请求实现正确
- [x] 错误处理完善

### 视觉反馈
- [x] 被提及的 AI 卡片高亮
- [x] 未提及的 AI 半透明
- [x] "正在输入"动画
- [x] 在线状态指示器
- [x] 错误状态显示

### 响应式设计
- [x] 桌面端:三列布局
- [x] 平板:自适应布局
- [x] 移动端:单列堆叠
- [x] 自动补全响应式显示

## 许可证

MIT

## 贡献

欢迎提交 Issue 和 Pull Request！
