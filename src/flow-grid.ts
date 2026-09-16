import type { FlowGridItem, PositionedItem } from './types'
import { computeLayout } from './core/layout'

/** FlowGrid 初始化选项 */
export interface FlowGridInitOptions {
  /** 列间距 / 行间距（px），默认 16 */
  gap?: number
  /** 单列最小宽度（px），默认 220 */
  minColumnWidth?: number
  /** 最大列数上限 */
  maxColumns?: number
  /** 强制列宽（px）；指定后忽略 minColumnWidth 推导 */
  columnWidth?: number
  /** 每次布局完成后的回调，便于做动画 / 埋点 */
  onRender?: (positions: PositionedItem[]) => void
  /** 关闭响应式（不监听容器尺寸变化），默认 false（开启） */
  static?: boolean
}

/**
 * FlowGrid —— 零依赖的响应式瀑布流 DOM 渲染器。
 *
 * 特性：
 * - 子元素通过 `data-flow-id` 与条目 id 对应；
 * - 使用 ResizeObserver 监听容器尺寸，自动重排（响应式）；
 * - 布局用 transform: translate 定位，避免触发 layout 回流，性能友好；
 * - 纯原生实现，可在任意框架（React / Vue / 原生）中嵌入。
 */
export class FlowGrid {
  private readonly container: HTMLElement
  private items: FlowGridItem[] = []
  private opts: Required<
    Pick<FlowGridInitOptions, 'gap' | 'minColumnWidth' | 'maxColumns' | 'static'>
  > &
    Pick<FlowGridInitOptions, 'columnWidth' | 'onRender'>
  private resizeObserver: ResizeObserver | null = null

  constructor(container: HTMLElement, options: FlowGridInitOptions = {}) {
    this.container = container
    this.opts = {
      gap: options.gap ?? 16,
      minColumnWidth: options.minColumnWidth ?? 220,
      maxColumns: options.maxColumns ?? Number.POSITIVE_INFINITY,
      static: options.static ?? false,
      columnWidth: options.columnWidth,
      onRender: options.onRender
    }

    this.container.style.position = 'relative'
    this.container.style.width = '100%'

    if (!this.opts.static && typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.render())
      this.resizeObserver.observe(this.container)
    }

    this.render()
  }

  /** 替换全部条目并重排 */
  setItems(items: FlowGridItem[]): void {
    this.items = items
    this.render()
  }

  /** 合并更新选项后重排 */
  updateOptions(options: FlowGridInitOptions): void {
    this.opts = {
      ...this.opts,
      gap: options.gap ?? this.opts.gap,
      minColumnWidth: options.minColumnWidth ?? this.opts.minColumnWidth,
      maxColumns: options.maxColumns ?? this.opts.maxColumns,
      static: options.static ?? this.opts.static,
      columnWidth: options.columnWidth ?? this.opts.columnWidth,
      onRender: options.onRender ?? this.opts.onRender
    }
    this.render()
  }

  /** 执行一次布局 */
  render(): void {
    const width = this.container.clientWidth
    if (width <= 0) return

    const result = computeLayout(this.items, {
      containerWidth: width,
      gap: this.opts.gap,
      minColumnWidth: this.opts.minColumnWidth,
      maxColumns: this.opts.maxColumns,
      columnWidth: this.opts.columnWidth
    })

    for (const pos of result.positions) {
      const el = this.container.querySelector<HTMLElement>(
        `[data-flow-id="${CSS.escape(pos.id)}"]`
      )
      if (!el) continue
      el.style.position = 'absolute'
      el.style.top = '0'
      el.style.left = '0'
      el.style.width = `${pos.width}px`
      el.style.height = `${pos.height}px`
      el.style.transform = `translate(${pos.x}px, ${pos.y}px)`
    }

    this.container.style.height = `${result.containerHeight}px`
    this.opts.onRender?.(result.positions)
  }

  /** 销毁，解除 ResizeObserver 监听 */
  destroy(): void {
    this.resizeObserver?.disconnect()
    this.resizeObserver = null
  }
}
