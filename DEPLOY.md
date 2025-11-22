# 部署到 GitHub Pages

本项目配置为自动部署到 GitHub Pages。

## 自动部署

### 配置要求

1. **启用 GitHub Pages**
   - 进入仓库 Settings → Pages
   - Source 选择 "GitHub Actions"
   - 保存设置

2. **推送到 main 分支**
   ```bash
   git push origin main
   ```

3. **等待部署完成**
   - 查看 Actions 标签页
   - 等待 "Deploy to GitHub Pages" workflow 完成
   - 部署成功后访问：`https://yourusername.github.io/ai/`

### 部署流程

```
推送代码到 main
    ↓
GitHub Actions 触发
    ↓
1. 安装依赖 (npm ci)
    ↓
2. 构建项目 (npm run build)
    ↓
3. 生成静态文件到 out/
    ↓
4. 添加 .nojekyll
    ↓
5. 验证 404.html
    ↓
6. 部署到 GitHub Pages
    ↓
✅ 部署完成
```

## 本地测试静态构建

在部署前，建议先本地测试静态构建：

```bash
# 安装依赖
npm install

# 构建静态文件
npm run build

# 查看输出
ls -la out/

# 使用 HTTP 服务器测试（需要安装 serve）
npx serve out -p 3000

# 访问 http://localhost:3000/ai/
```

## 404 处理机制

本项目使用自定义 404.html 来处理 SPA 路由：

### 工作原理

1. **用户访问子路径**
   ```
   https://yourusername.github.io/ai/some-page
   ```

2. **GitHub Pages 返回 404**
   - 因为静态文件中没有 `/some-page` 目录

3. **404.html 重定向**
   ```javascript
   // 404.html 脚本
   window.location.replace(
     '/ai/index.html?redirect=/some-page'
   )
   ```

4. **index.html 处理重定向**
   ```javascript
   // layout.tsx 中的脚本
   var redirect = new URLSearchParams(window.location.search).get('redirect');
   if (redirect) {
     window.history.replaceState(null, '', '/ai' + redirect);
   }
   ```

5. **Next.js 路由接管**
   - 客户端路由正常工作
   - URL 显示正确的路径

### 文件说明

- **public/404.html**: GitHub Pages 的自定义 404 页面
- **public/.nojekyll**: 禁用 Jekyll 处理，避免下划线开头的文件被忽略
- **next.config.js**: 配置 `basePath: '/ai'` 和 `output: 'export'`

## 配置文件

### next.config.js

```javascript
{
  output: 'export',          // 静态导出
  basePath: '/ai',           // 子路径（仓库名）
  trailingSlash: true,       // URL 末尾斜杠
  images: { unoptimized: true }  // 禁用图片优化
}
```

### .github/workflows/deploy.yml

- 监听 `main` 分支的 push
- 自动构建和部署
- 支持手动触发 (workflow_dispatch)

## 常见问题

### 1. 404 错误

**症状**: 访问 `https://yourusername.github.io/ai/` 显示 404

**解决**:
- 检查 GitHub Pages 设置是否选择了 "GitHub Actions"
- 确认 workflow 是否执行成功
- 等待 5-10 分钟让 GitHub Pages 更新

### 2. 资源加载失败

**症状**: 页面打开但样式/脚本加载失败

**解决**:
- 检查 `basePath` 配置是否与仓库名匹配
- 清除浏览器缓存
- 检查浏览器控制台的错误信息

### 3. 刷新页面 404

**症状**: 首次访问正常，刷新后 404

**解决**:
- 确认 `public/404.html` 存在
- 检查 404.html 中的 `basePath` 是否正确
- 查看浏览器控制台是否有重定向错误

### 4. 主题不生效

**症状**: 页面加载时闪烁或主题错误

**解决**:
- 检查 layout.tsx 中的主题初始化脚本
- 清除 localStorage 并刷新
- 确认 CSP 策略允许 `unsafe-inline`

## 手动部署

如果自动部署失败，可以手动部署：

```bash
# 1. 构建
npm run build

# 2. 进入输出目录
cd out

# 3. 初始化 git（如果需要）
git init
git add -A
git commit -m "Deploy to GitHub Pages"

# 4. 推送到 gh-pages 分支
git push -f git@github.com:yourusername/ai.git main:gh-pages

# 5. 在 GitHub Pages 设置中选择 gh-pages 分支
```

## 验证部署

部署成功后，访问以下 URL 验证：

- ✅ 首页: `https://yourusername.github.io/ai/`
- ✅ 刷新: 按 F5 刷新，应该正常工作
- ✅ 直接访问: 在新标签页打开任意子路径
- ✅ 主题: 切换主题并刷新，应该保持
- ✅ API 密钥: 设置 API 密钥并刷新，应该保持（加密存储）

## 性能优化

### CDN 缓存

GitHub Pages 使用 Fastly CDN，首次部署后：
- 全球缓存更新需要 5-10 分钟
- 可以使用 `Ctrl+Shift+R` 强制刷新
- 或在隐私模式下测试

### 构建优化

```bash
# 生产构建已自动优化：
# - JavaScript 压缩
# - CSS 压缩
# - 死代码消除
# - Tree shaking
```

## 更新部署

推送到 main 分支会自动触发部署：

```bash
git add .
git commit -m "Update features"
git push origin main
```

## 回滚部署

如果新版本有问题，可以回滚：

```bash
# 1. 查看历史提交
git log --oneline

# 2. 回滚到指定提交
git revert <commit-hash>

# 3. 推送触发重新部署
git push origin main
```

## 监控部署

- **Actions 页面**: 查看构建日志
- **Deployments 页面**: 查看部署历史
- **Pages 设置**: 查看当前部署状态

## 自定义域名（可选）

如果想使用自定义域名：

1. 在仓库根目录添加 `public/CNAME` 文件
   ```
   your-domain.com
   ```

2. 在域名 DNS 设置中添加 CNAME 记录
   ```
   CNAME  @  yourusername.github.io
   ```

3. 等待 DNS 传播（最多 24 小时）

4. 在 GitHub Pages 设置中启用 HTTPS

## 安全建议

- ✅ 不要在代码中硬编码 API 密钥
- ✅ 使用 URL 参数传递 API 密钥仅用于测试
- ✅ API 密钥已使用 AES-256-GCM 加密存储
- ✅ CSP 策略保护防止 XSS 攻击
- ✅ 所有请求强制 HTTPS

## 技术支持

如果遇到问题：
1. 检查 [GitHub Pages 文档](https://docs.github.com/pages)
2. 查看 [Next.js 静态导出文档](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
3. 提交 Issue 到项目仓库
