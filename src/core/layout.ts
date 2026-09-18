import type {
  FlowGridItem,
  FlowGridOptions,
  LayoutResult,
  PositionedItem
} from '../types'

/**
 * 根据容器宽度推导列数。
 *
 * 公式：floor((容器宽 + 间距) / (单列最小宽 + 间距))
 * 等价于「每隔一列宽+一个间距能塞下几列」。
 */
export function getColumnCount(
  containerWidth: number,
  opts: { gap: number; minColumnWidth: number; maxColumns: number }
): number {
  const { gap, minColumnWidth, maxColumns } = opts
  if (containerWidth <= 0) return 1
  const raw = Math.floor((containerWidth + gap) / (minColumnWidth + gap))
  return Math.max(1, Math.min(raw, maxColumns))
}

/**
 * 核心布局算法：最短列优先（Shortest-Column-First）。
 *
 * 思路：
 * 1. 由容器宽度推导列数 columnCount 与每列实际列宽 columnWidth；
 * 2. 维护 columnHeights[列数] 记录每列当前高度，初始全 0；
 * 3. 依次放置每个条目：选当前最矮的列，按列宽等比缩放条目高度，
 *    计算 x/y 后更新该列高度（+ 缩放后高度 + 间距）；
 * 4. 容器总高度 = 各列最大高度 - 一个间距（末尾多余间距裁剪掉）。
 *
 * 该实现为纯函数，不依赖 DOM，便于单元测试与 SSR / Worker 复用。
 */
export function computeLayout(
  items: FlowGridItem[],
  options: FlowGridOptions
): LayoutResult {
  const gap = options.gap ?? 16
  const minColumnWidth = options.minColumnWidth ?? 220
  const maxColumns = options.maxColumns ?? Number.POSITIVE_INFINITY
  const containerWidth = options.containerWidth

  // 指定了强制列宽时，用「该列宽」推导能放下几列；否则用 minColumnWidth 推导
  const effectiveMin =
    options.columnWidth != null ? options.columnWidth : minColumnWidth

  const columnCount = getColumnCount(containerWidth, {
    gap,
    minColumnWidth: effectiveMin,
    maxColumns
  })

  const columnWidth =
    options.columnWidth != null
      ? options.columnWidth
      : (containerWidth - gap * (columnCount - 1)) / columnCount

  const columnHeights = new Array<number>(columnCount).fill(0)
  const positions: PositionedItem[] = []

  for (const item of items) {
    // 找最短列
    let target = 0
    for (let i = 1; i < columnCount; i++) {
      if (columnHeights[i] < columnHeights[target]) target = i
    }

    // 防御：条目宽高为 0 / 非法时，用列宽兜底等比，避免除零得到 Infinity 撑崩页面
    const safeWidth = item.width > 0 ? item.width : columnWidth
    const safeHeight = item.height > 0 ? item.height : 0
    const scale = columnWidth / safeWidth
    const scaledHeight = safeHeight * scale
    const x = target * (columnWidth + gap)
    const y = columnHeights[target]

    positions.push({
      id: item.id,
      x,
      y,
      width: columnWidth,
      height: scaledHeight,
      columnIndex: target
    })

    columnHeights[target] += scaledHeight + gap
  }

  const maxColumnHeight = columnHeights.reduce(
    (m, h) => Math.max(m, h),
    0
  )
  // 末尾多余一个间距需裁掉；无条目时高度为 0
  const containerHeight = items.length
    ? Math.max(0, maxColumnHeight - gap)
    : 0

  return { positions, columnCount, columnWidth, containerHeight }
}
