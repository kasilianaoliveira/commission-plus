import { TrendingUp } from 'lucide-react'

export function AppHeader() {
  return (
    <header className="topbar">
      <a className="brand" href="#top" aria-label="Comissão Plus — início">
        <span className="brand-mark">
          <TrendingUp size={22} strokeWidth={2.5} />
        </span>
        <span>
          Comissão<span>+</span>
        </span>
      </a>
      <span className="today-label">Calculadora de comissões</span>
    </header>
  )
}
