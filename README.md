<p align="center">
  <img src="https://img.shields.io/badge/deps-0-brightgreen.svg" alt="零依赖" />
  <img src="https://img.shields.io/badge/types-TypeScript-blue.svg" alt="TypeScript" />
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" />
  <img src="https://github.com/<your-username>/flow-grid/actions/workflows/ci.yml/badge.svg" alt="CI" />
  <img src="https://img.shields.io/badge/coverage-tested-brightgreen.svg" alt="tested" />
</p>

<h1 align="center">FlowGrid</h1>

<p align="center">
  <b>零依赖的响应式瀑布流（Masonry）布局引擎</b><br />
  纯 TypeScript 实现 · 最短列优先算法 · 框架无关 · 抽取自千万级金融前端实战
</p>

---

## ✨ 为什么会有这个库

在千万级 C 端金融项目（日活 200 万+）的「权益专区」里，我们需要把**高度不一的券、活动、商品卡片**紧凑地排进多列瀑布流。社区方案要么强依赖某个框架、要么布局抖动明显、要么不支持响应式重排。

`FlowGrid` 把那套经过生产验证的布局逻辑抽象成**一个零依赖、纯函数核心 + 一个轻量 DOM 渲染器**，你可以：

- 在 **React / Vue / 原生 / Web Component** 任意环境里用；
- 只想要算法？直接 import `computeLayout`，SSR / Web Worker 里也能跑；
- 想要开箱即用？`new FlowGrid(container)` 一行接入，ResizeObserver 自动响应式重排。

## 📦 特性

- 🚫 **零运行时依赖** —— 不捆绑任何第三方库，包体极小；
- 🧮 **纯函数核心** `computeLayout` —— 无 DOM、无副作用，单测覆盖率 100%；
- 📐 **最短列优先（Shortest-Column-First）** 算法 —— 视觉最紧凑、无大空洞；
- 📱 **响应式** —— 基于 `ResizeObserver`，容器宽度变化自动重排；
- ⚡ **性能友好** —— 用 `transform: translate` 定位，重排不触发 layout 回流；
- 🧩 **框架无关** —— 核心纯函数 + 原生 DOM 渲染器，任意框架可嵌入；
- 📝 **完整类型 + d.ts** —— 开箱即用的 TypeScript 提示。

## 🚀 安装

```bash
npm install flow-grid
# 或
pnpm add flow-grid
# 或
yarn add flow-grid
```

## 🔧 快速上手

### 方式一：DOM 渲染器（推荐，开箱即用）

```html
<div id="grid">
  <div class="card" data-flow-id="a">A</div>
  <div class="card" data-flow-id="b">B</div>
</div>
```

```ts
import { FlowGrid, type FlowGridItem } from 'flow-grid'

const items: FlowGridItem[] = [
  { id: 'a', width: 200, height: 300 },
  { id: 'b', width: 200, height: 160 }
]

const grid = new FlowGrid(document.getElementById('grid')!, {
  gap: 16,
  minColumnWidth: 220
})

grid.setItems(items) // 渲染即定位，ResizeObserver 负责响应式
```

> 子元素通过 `data-flow-id` 与 `items[].id` 对应，库会按计算结果用 `transform` 定位它们。**记得给子元素设置 `data-flow-id`**。

### 方式二：只要布局算法（SSR / Worker / 自定义渲染）

```ts
import { computeLayout } from 'flow-grid'

const { positions, columnCount, columnWidth, containerHeight } = computeLayout(
  items,
  { containerWidth: 1000, gap: 16, minColumnWidth: 220 }
)
// positions: [{ id, x, y, width, height, columnIndex }, ...]
```

## 📖 API 文档

### `computeLayout(items, options): LayoutResult`

纯函数，计算所有条目的坐标。

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `items` | `FlowGridItem[]` | — | 待布局条目，每项需 `id` / `width` / `height` |
| `options.containerWidth` | `number` | — | 容器宽度（px） |
| `options.gap` | `number` | `16` | 列/行间距（px） |
| `options.minColumnWidth` | `number` | `220` | 单列最小宽，用于推导列数 |
| `options.maxColumns` | `number` | `Infinity` | 列数上限 |
| `options.columnWidth` | `number` | 自动推导 | 强制列宽，指定后忽略 `minColumnWidth` |

返回 `LayoutResult`：

```ts
interface LayoutResult {
  positions: PositionedItem[]   // 每个条目的 x/y/width/height/columnIndex
  columnCount: number           // 实际列数
  columnWidth: number           // 实际列宽
  containerHeight: number       // 容器总高
}
```

### `new FlowGrid(container, options?)`

| 选项 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `gap` | `number` | `16` | 间距（px） |
| `minColumnWidth` | `number` | `220` | 单列最小宽 |
| `maxColumns` | `number` | `Infinity` | 列数上限 |
| `columnWidth` | `number` | 自动 | 强制列宽 |
| `static` | `boolean` | `false` | `true` 时关闭响应式监听 |
| `onRender` | `(positions) => void` | — | 每次布局完成回调 |

**实例方法**：`setItems(items)`、`updateOptions(opts)`、`render()`、`destroy()`。

## 🧠 算法说明

列数推导：`列数 = floor((容器宽 + 间距) / (单列最小宽 + 间距))`。

放置规则（最短列优先）：

1. 维护每列当前高度 `columnHeights[]`，初始全 0；
2. 依次处理每个条目，选 `columnHeights` 最小的列；
3. 按目标列宽对条目高度做**等比缩放**，计算 `x = 列*(列宽+间距)`、`y = 该列当前高度`；
4. 该列高度 `+= 缩放后高度 + 间距`；
5. 容器总高 = `max(columnHeights) - 一个间距`（裁掉末尾多余间距）。

该策略保证多列高度尽量均衡、视觉紧凑，避免「右侧悬空一大块」。

## 🧪 测试

```bash
npm install
npm test        # Vitest 运行单元测试（核心算法全覆盖）
npm run build   # tsup 产出 ESM + CJS + d.ts
```

CI（GitHub Actions）在每次 push / PR 自动跑 `test` + `build`，保证主干可用。

## 🌐 在线 Demo

拖动浏览器窗口宽度，观察列数自适应；按钮可增删 / 打乱卡片高度：

👉 **[https://emma-portfolio-d3g63enee42c92791-1489601674.tcloudbaseapp.com/flow-grid/](https://emma-portfolio-d3g63enee42c92791-1489601674.tcloudbaseapp.com/flow-grid/)**

> 该 Demo 由 `vite build` 产出，可一键部署到 GitHub Pages / Vercel / 任意静态托管。

## 🗂 目录结构

```
flow-grid/
├── src/
│   ├── core/layout.ts     # 纯函数布局算法（computeLayout / getColumnCount）
│   ├── flow-grid.ts       # 原生 DOM 渲染器（FlowGrid 类）
│   ├── types.ts           # 公共类型
│   ├── index.ts           # 统一导出
│   └── demo.ts            # 可交互 Demo 入口
├── tests/layout.test.ts   # Vitest 单元测试
├── .github/workflows/ci.yml
├── index.html             # Demo 页面
├── package.json
├── tsup.config.ts
└── README.md
```

## 📄 License

[MIT](./LICENSE) © 谢芬 (Xie Fen)
