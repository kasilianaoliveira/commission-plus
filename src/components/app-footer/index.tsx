import styles from './style.module.css'
import { TrendingUp } from 'lucide-react'

export function AppFooter() {
  return (
    <footer className={styles.footer}>
      <span className={[styles['brand'], styles['brand--small']].join(' ')}>
        <span className={styles['brand-mark']}>
          <TrendingUp size={16} />
        </span>
        Comissão<span>+</span>
      </span>
      <p>Os dados ficam salvos neste navegador.</p>
    </footer>
  )
}
