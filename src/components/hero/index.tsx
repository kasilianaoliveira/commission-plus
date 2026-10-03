import { Calculator } from 'lucide-react'
import styles from './style.module.css'

export function Hero() {
  return (
    <section className={styles['hero-copy']}>
      <div className={styles['eyebrow']}>
        <Calculator size={15} /> Cálculo diário
      </div>
      <h1>
        Comissões do dia,
        <br />
        <em>sem complicação.</em>
      </h1>
      <p>
        Informe as vendas, ajuste as regras de cada pessoa e veja os valores
        calculados na hora.
      </p>
    </section>
  )
}
