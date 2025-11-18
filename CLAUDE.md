# AI Trio Chat - 三 AI 协作助手

## 核心功能需求

### @Mention 系统
用户可以通过 @ 语法指定消息接收者:

1. **@claude** (或 @analyst, @creator, @evaluator) - 指定单个 AI 回答
2. **@all** - 同时向所有在线 AI 发送消息
3. **无 @** - 默认按照协作模式(三个 AI 依次回答)

### @Mention 交互设计
- 输入 @ 时显示自动补全下拉菜单
- 支持键盘导航选择(↑↓ 和 Enter)
- 显示每个 AI 的在线状态(绿点表示可用)
- 支持多个 @mention (例如: @analyst @creator)
- @all 会高亮显示,且优先级最高

### AI Agent 配置
```javascript
const AI_AGENTS = [
  {
    id: 'analyst',
    name: '分析者 Claude',
    mention: '@analyst',
    color: 'blue',
    role: '问题分析和信息提取',
    systemPrompt: '你是一个逻辑严密的分析师...',
    model: 'anthropic/claude-3.5-sonnet' // OpenRouter model ID
  },
  {
    id: 'creator', 
    name: '创意者 GPT',
    mention: '@creator',
    color: 'purple',
    role: '创新方案和头脑风暴',
    systemPrompt: '你是一个充满创意的思考者...',
    model: 'openai/gpt-4-turbo'
  },
  {
    id: 'evaluator',
    name: '评估者 Gemini',
    mention: '@evaluator', 
    color: 'green',
    role: '方案评估和风险分析',
    systemPrompt: '你是一个谨慎的评估专家...',
    model: 'google/gemini-pro-1.5'
  }
];
```

## 消息路由逻辑

### 解析规则
```typescript
// 示例输入: "@analyst @creator 如何优化这段代码?"
// 解析结果:
{
  mentions: ['analyst', 'creator'],
  cleanContent: '如何优化这段代码?',
  isAll: false
}

// 示例输入: "@all 这个方案可行吗?"
// 解析结果:
{
  mentions: ['analyst', 'creator', 'evaluator'],
  cleanContent: '这个方案可行吗?',
  isAll: true
}
```

### 发送策略
- 如果有 @mention: 仅向提及的 AI 发送
- 如果是 @all: 向所有在线 AI 并行发送
- 如果无 @: 按默认协作流程(分析→创意→评估)

## 组件更新需求

### ChatInput 组件增强
- 监听 @ 字符输入
- 显示自动补全菜单
- 支持键盘和鼠标选择
- @mention 高亮显示(不同颜色标签)

### AIAgent 组件增强  
- 显示在线/离线状态指示器
- 被 @mention 时边框高亮
- 显示"正在输入..."动画
- 支持单独的错误状态

## 状态管理扩展
```typescript
interface ChatState {
  // ... 原有状态
  
  agents: Array<{
    id: string;
    status: 'online' | 'offline' | 'typing' | 'error';
    lastActive: number;
  }>;
  
  // 新增 Actions
  sendToSpecificAgents: (
    message: string, 
    agentIds: string[]
  ) => Promise<void>;
  
  parseMessage: (input: string) => {
    mentions: string[];
    cleanContent: string;
    isAll: boolean;
  };
}
```

## 响应式布局调整
- 被 @mention 的 AI 卡片在移动端自动滚动到视图
- 未被提及的 AI 卡片半透明显示(opacity-50)
- @all 模式下所有卡片同等亮度