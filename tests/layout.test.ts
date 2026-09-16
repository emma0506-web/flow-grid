import { describe, it, expect } from 'vitest'
import { getColumnCount, computeLayout } from '../src/core/layout'
import type { FlowGridItem } from '../src/types'

function makeItems(n: number): FlowGridItem[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `item-${i}`,
    width: 200,
    height: 100 + (i % 5) * 40
  }))
}

describe('getColumnCount', () => {
  it('容器宽度 <= 0 时返回 1 列', () => {
    expect(getColumnCount(0, { gap: 16, minColumnWidth: 220, maxColumns: 4 })).toBe(1)
    expect(getColumnCount(-100, { gap: 16, minColumnWidth: 220, maxColumns: 4 })).toBe(1)
  })

  it('窄容器只放得下 1 列', () => {
    // (300 + 16) / (220 + 16) = 1.34 -> floor = 1
    expect(getColumnCount(300, { gap: 16, minColumnWidth: 220, maxColumns: 4 })).toBe(1)
  })

  it('宽容器按最小列宽推导列数', () => {
    // (1000 + 16) / (220 + 16) = 4.31 -> floor = 4
    expect(getColumnCount(1000, { gap: 16, minColumnWidth: 220, maxColumns: 99 })).toBe(4)
  })

  it('受 maxColumns 上限约束', () => {
    expect(getColumnCount(3000, { gap: 16, minColumnWidth: 220, maxColumns: 3 })).toBe(3)
  })

  it('受 gap 影响', () => {
    // 大间距会少一列
    expect(getColumnCount(1000, { gap: 100, minColumnWidth: 220, maxColumns: 99 })).toBe(
      Math.floor((1000 + 100) / (220 + 100))
    )
  })
})

describe('computeLayout', () => {
  it('空条目返回高度为 0', () => {
    const r = computeLayout([], { containerWidth: 1000 })
    expect(r.positions).toHaveLength(0)
    expect(r.containerHeight).toBe(0)
  })

  it('列宽 = (容器宽 - 间距*(列数-1)) / 列数', () => {
    const r = computeLayout(makeItems(10), {
      containerWidth: 1000,
      gap: 16,
      minColumnWidth: 220,
      maxColumns: 99
    })
    expect(r.columnCount).toBe(4)
    // (1000 - 16*3) / 4 = 238
    expect(r.columnWidth).toBeCloseTo(238, 5)
  })

  it('按最短列优先放置，x 坐标正确', () => {
    const items: FlowGridItem[] = [
      { id: 'a', width: 200, height: 100 },
      { id: 'b', width: 200, height: 100 },
      { id: 'c', width: 200, height: 100 },
      { id: 'd', width: 200, height: 100 }
    ]
    const r = computeLayout(items, {
      containerWidth: 1000,
      gap: 16,
      minColumnWidth: 220,
      maxColumns: 99
    })
    // 4 列，第 0 列 x = 0，第 1 列 x = 238 + 16 = 254 ...
    expect(r.positions[0].x).toBeCloseTo(0, 5)
    expect(r.positions[1].x).toBeCloseTo(254, 5)
    expect(r.positions[2].x).toBeCloseTo(508, 5)
    expect(r.positions[3].x).toBeCloseTo(762, 5)
  })

  it('条目等比缩放：高度随列宽缩放', () => {
    const items: FlowGridItem[] = [{ id: 'a', width: 200, height: 400 }]
    const r = computeLayout(items, {
      containerWidth: 1000,
      gap: 16,
      minColumnWidth: 220,
      maxColumns: 99
    })
    const p = r.positions[0]
    // 列宽 238 / 固有宽 200 = 1.19 倍；高度 400 * 1.19 = 476
    expect(p.width).toBeCloseTo(238, 5)
    expect(p.height).toBeCloseTo(400 * (238 / 200), 5)
  })

  it('容器高度 = 最高列高度 - 一个间距', () => {
    // 4 列各 1 个等高等宽条目，每列高度 = scaledHeight + gap，最高列=scaledHeight+gap
    const items: FlowGridItem[] = Array.from({ length: 4 }, (_, i) => ({
      id: `k${i}`,
      width: 200,
      height: 100
    }))
    const r = computeLayout(items, {
      containerWidth: 1000,
      gap: 16,
      minColumnWidth: 220,
      maxColumns: 99
    })
    const scaled = 100 * (238 / 200) // = 119
    // 每列 1 项：columnHeights = 119 + 16 = 135；容器高 = 135 - 16 = 119
    expect(r.containerHeight).toBeCloseTo(scaled, 5)
  })

  it('不平衡条目：超高条目独占一列且该列最高，同列无重叠', () => {
    // 1 个超高 + 9 个矮条目，验证最短列优先的正确特性
    const items: FlowGridItem[] = [
      { id: 'tall', width: 200, height: 1000 },
      ...Array.from({ length: 9 }, (_, i) => ({
        id: `s${i}`,
        width: 200,
        height: 50
      }))
    ]
    const r = computeLayout(items, {
      containerWidth: 1000,
      gap: 16,
      minColumnWidth: 220,
      maxColumns: 99
    })
    expect(r.positions).toHaveLength(10)

    // 统计每列总高（含间距），tall 所在列应最高
    const colHeights = new Array(r.columnCount).fill(0)
    for (const p of r.positions) colHeights[p.columnIndex] += p.height + 16
    const tallPos = r.positions.find((p) => p.id === 'tall')!
    expect(colHeights[tallPos.columnIndex]).toBeCloseTo(Math.max(...colHeights), 3)

    // 同一列内 y 严格递增 => 无重叠
    const byCol: Record<number, number[]> = {}
    for (const p of r.positions) (byCol[p.columnIndex] ||= []).push(p.y)
    for (const col of Object.values(byCol)) {
      for (let i = 1; i < col.length; i++) {
        expect(col[i]).toBeGreaterThan(col[i - 1])
      }
    }
  })

  it('强制 columnWidth 时忽略 minColumnWidth 推导', () => {
    const r = computeLayout(makeItems(6), {
      containerWidth: 1000,
      gap: 16,
      minColumnWidth: 220,
      maxColumns: 99,
      columnWidth: 300
    })
    expect(r.columnWidth).toBe(300)
    // 1000 = 300*3 + 16*2 = 932 <= 1000；4 列需要 300*4+16*3=1248 > 1000 -> 3 列
    expect(r.columnCount).toBe(3)
    expect(r.positions[0].x).toBeCloseTo(0, 5)
    expect(r.positions[1].x).toBeCloseTo(316, 5)
  })
})
