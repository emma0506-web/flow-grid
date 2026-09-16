/**
 * FlowGrid 公共类型定义
 */

/** 一个待布局的条目，需提供固有宽高（用于等比缩放计算） */
export interface FlowGridItem {
  /** 唯一标识，DOM 渲染时映射到 [data-flow-id] */
  id: string
  /** 固有宽度（px） */
  width: number
  /** 固有高度（px） */
  height: number
  /** 可选附加数据，原样透传，方便业务层使用 */
  meta?: Record<string, unknown>
}

/** 布局计算参数 */
export interface FlowGridOptions {
  /** 容器宽度（px） */
  containerWidth: number
  /** 列间距 / 行间距（px），默认 16 */
  gap?: number
  /** 单列最小宽度（px），用于推导列数，默认 220 */
  minColumnWidth?: number
  /** 最大列数上限，默认 Infinity（不限制） */
  maxColumns?: number
  /** 强制列宽（px）；指定后忽略 minColumnWidth 推导 */
  columnWidth?: number
}

/** 计算得到的具体位置 */
export interface PositionedItem {
  id: string
  /** 左偏移（px） */
  x: number
  /** 上偏移（px） */
  y: number
  /** 实际渲染宽度（px） */
  width: number
  /** 实际渲染高度（px） */
  height: number
  /** 落到的列索引 */
  columnIndex: number
}

/** 完整布局结果 */
export interface LayoutResult {
  positions: PositionedItem[]
  /** 实际列数 */
  columnCount: number
  /** 实际列宽（px） */
  columnWidth: number
  /** 容器总高度（px） */
  containerHeight: number
}
