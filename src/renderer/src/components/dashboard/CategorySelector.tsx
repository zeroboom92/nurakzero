import { useTaskStore } from '@/stores/taskStore'

/**
 * 담당 업무(카테고리) 선택. 1차 버전은 개인정보보호 중심이며,
 * 카테고리가 여러 개일 때 드롭다운으로 전환한다.
 */
export function CategorySelector(): JSX.Element {
  const categories = useTaskStore((s) => s.categories)
  const selected = useTaskStore((s) => s.selectedCategory)
  const setSelected = useTaskStore((s) => s.setSelectedCategory)

  const current = categories.find((c) => c.id === selected)

  if (categories.length <= 1) {
    return <span className="category-badge">{current?.name ?? '개인정보보호'}</span>
  }

  return (
    <select
      className="category-select no-drag"
      value={selected}
      onChange={(e) => setSelected(e.target.value)}
    >
      {categories.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  )
}
