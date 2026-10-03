import { TrendingUp } from 'lucide-react'
import styles from './style.module.css'

export function Header() {
  return (
    <header className={styles['topbar']}>
      <a
        className={styles['brand']}
        href="#top"
        aria-label="Comissão Plus — início"
      >
        <span className={styles['brand-mark']}>
          <TrendingUp
            size={22}
            strokeWidth={2.5}
          />
        </span>
        <span>
          Comissão<span>+</span>
        </span>
      </a>
      <span className={styles['today-label']}>Calculadora de comissões</span>
    </header>
  )
}
