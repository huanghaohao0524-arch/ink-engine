# 墨引擎

墨引擎是一个本地优先的 AI 网文写作工作台实验版。它的目标不是替作者一键写完一本书，而是把网文创作里反复出现的流程串起来：立项、平台规则、设定、大纲、章节草稿、候选区、修订、追踪同步和导出。

这个仓库现在更适合给感兴趣的人试玩、拆开研究和继续改造。它不是一个成熟商业产品。

## 当前状态

- 桌面应用：Electron + Vite + React。
- AI 调用：用户自己填写 OpenAI 兼容接口、Base URL、模型和 API Key。
- 写作库：默认面向本地文件夹，例如 `D:\ai\写作`。
- 前端状态：当前可运行界面主要来自恢复后的 `public/legacy-runtime.js`，再叠加 `public/bookshelf-enhancer.js`。
- 源码状态：`src/App.tsx` 保留了恢复期的源码契约和测试锚点，后续贡献者如果要认真开发，第一件大事是把 legacy runtime 还原成可维护的 React 源码。

## 能玩什么

- 选择本地写作库。
- 扫描已有书籍项目。
- 新建书籍立项。
- 配置 AI 接口。
- 进入章节编辑器。
- 生成、检查、修订章节候选。
- 候选内容在应用前不会直接覆盖正文。
- 执行部分写作流程 smoke 检查。

## 安装与启动

```bash
npm install
npm run dev
```

如果只想确认打包链路：

```bash
npm run lint
npm run build
```

常用 smoke：

```bash
npm run smoke:user-journeys
npm run smoke:writing-companion-copilot
```

完整 smoke 很多，且不少是源码契约检查，不等同于真实用户体验通过。

## 使用前准备

1. 准备一个本地写作库目录。
2. 启动应用后选择该目录。
3. 在 AI 设置里填写自己的 API Key、Base URL 和模型。
4. 新建一本书，或打开已有标准项目。

API Key 保存在本机 Electron Store 中，不应该提交到仓库。

## 项目结构

```text
electron/               Electron 主进程与 preload
public/                 当前实际运行的 legacy runtime 和增强层
src/                    恢复期 React 源码契约
scripts/                smoke、采样、题材指纹和维护脚本
build/                  图标与内置写作指纹资料
docs/                   设计、计划和公开仓库说明
产品需求文档.md          第一版产品范围
```

被 `.gitignore` 排除的内容包括：`node_modules/`、`dist/`、`release/`、`artifacts/`、本地日志、`.env*`、恢复残留和第三方临时目录。

## 重要提醒

这个项目曾经历过源码恢复，当前运行链路和源码链路并不完全一致：

- `npm run dev` 依赖 `public/legacy-runtime.js`。
- `npm run build` 可以通过，但构建产物不代表完整业务源码已经恢复。
- 很多 smoke 是为了守住恢复后的功能锚点，不是端到端浏览器测试。

如果你想贡献，最有价值的方向是：

1. 重建可维护的 React 源码入口。
2. 把 Electron 主进程里的 AI/文件/写作流程拆成小模块。
3. 建立真正的端到端用户路径测试。
4. 保留“AI 输出先进入候选区，不自动覆盖正文”的产品原则。

## License

MIT
