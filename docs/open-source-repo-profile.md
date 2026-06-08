# Open Source Repo Profile

## Repository Name

`ink-engine`

## Product Name

墨引擎

## GitHub Description

Local-first AI writing workbench for Chinese web-novel planning, drafting, revision, and project memory.

## Short Chinese Description

墨引擎是一个本地优先的 AI 网文写作工作台，用来把立项、平台规则、设定、大纲、章节候选、修订和追踪同步串成一条可玩的写作流程。

## Longer Public Intro

墨引擎不是“一键生成小说”的工具，而是一个实验性的写作搭档。它试图把中文网文创作中最容易断掉的部分连接起来：从一句脑洞开始，逐步沉淀平台规则、题材定位、角色设定、总纲、细纲、章节草稿和追踪表。

当前版本适合试玩和研究。项目经历过源码恢复，实际可运行界面主要依赖 `public/legacy-runtime.js` 和增强层，后续最有价值的贡献方向是重建可维护的 React 源码入口、拆分 Electron 主进程、补齐端到端用户路径测试。

## Topics

- `ai-writing`
- `electron`
- `react`
- `web-novel`
- `writing-tool`
- `local-first`
- `chinese-novel`
- `openai`
- `creative-writing`

## Suggested GitHub Create Command

```bash
gh repo create ink-engine --public --description "Local-first AI writing workbench for Chinese web-novel planning, drafting, revision, and project memory." --source . --remote origin --push
```

After creation:

```bash
gh repo edit ink-engine --add-topic ai-writing --add-topic electron --add-topic react --add-topic web-novel --add-topic writing-tool --add-topic local-first --add-topic chinese-novel --add-topic openai --add-topic creative-writing
```
