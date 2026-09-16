import { FlowGrid, type FlowGridItem } from './index'

const grid = document.getElementById('grid')!
const stat = document.getElementById('stat')!
const PALETTE = ['#2b6cff', '#16a34a', '#db2777', '#d97706', '#7c3aed', '#0891b2']

let seq = 0
function makeItems(n: number): FlowGridItem[] {
  return Array.from({ length: n }, () => {
    const id = `card-${seq++}`
    return {
      id,
      width: 200,
      height: 120 + Math.floor(Math.random() * 260)
    }
  })
}

let items: FlowGridItem[] = makeItems(24)

function paint() {
  grid.innerHTML = ''
  for (const it of items) {
    const el = document.createElement('div')
    el.className = 'card'
    el.setAttribute('data-flow-id', it.id)
    const c = PALETTE[Number(it.id.split('-')[1]) % PALETTE.length]
    el.style.background = `linear-gradient(160deg, ${c}33, #1a1d24 70%)`
    el.innerHTML = `<b>卡片 ${it.id}</b><span class="id">固有 ${it.width}×${it.height}</span>`
    grid.appendChild(el)
  }
}

const fg = new FlowGrid(grid, {
  gap: 16,
  minColumnWidth: 220,
  onRender: (positions) => {
    const cols = new Set(positions.map((p) => p.columnIndex)).size
    stat.textContent = `共 ${positions.length} 张 · ${cols} 列 · 容器高 ${Math.round(
      (grid.style.height || '0').replace('px', '') as unknown as number
    )}px`
  }
})

function refresh() {
  paint()
  fg.setItems(items)
}

refresh()

document.getElementById('add')!.onclick = () => {
  items = items.concat(makeItems(5))
  refresh()
}
document.getElementById('remove')!.onclick = () => {
  items = items.slice(0, Math.max(0, items.length - 5))
  refresh()
}
document.getElementById('shuffle')!.onclick = () => {
  items = items.map((it) => ({ ...it, height: 120 + Math.floor(Math.random() * 260) }))
  refresh()
}
