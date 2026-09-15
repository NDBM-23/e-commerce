import type { Category } from '../types/category'
import './Sidebar.css'

type SidebarProps = {
  categories: Category[]
  onCategorySelect: (category: Category) => void
}

function Sidebar({
  categories,
  onCategorySelect,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <p className="sidebar__title">
        CATEGORÍAS
      </p>

      <ul className="sidebar__list">
        {categories.map((category) => (
          <li key={category.id}>
            <button
              className="sidebar__item"
              onClick={() =>
                onCategorySelect(category)
              }
            >
              <span>{category.name}</span>

              <span className="sidebar__arrow">
                →
              </span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  )
}

export default Sidebar