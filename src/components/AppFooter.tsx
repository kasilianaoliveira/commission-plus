import { TrendingUp } from 'lucide-react'

export function AppFooter() {
  return (
    <footer>
      <span className="brand brand--small">
        <span className="brand-mark">
          <TrendingUp size={16} />
        </span>
        Comissão<span>+</span>
      </span>
      <p>Os dados ficam salvos neste navegador.</p>
    </footer>
  )
}
