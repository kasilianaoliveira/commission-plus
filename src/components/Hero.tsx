import { Calculator } from 'lucide-react'

export function Hero() {
  return (
    <section className="hero-copy">
      <div className="eyebrow">
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
