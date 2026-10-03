import { CommissionSection } from '../components/commission-section'
import { Footer } from '../components/footer'
import { Header } from '../components/header'
import { Hero } from '../components/hero'
import { SummaryCards } from '../components/summary-cards'
import { useCommissionPeople } from '../hooks/use-commission-people'
import { exportSummary } from '../utils/export-summary'
import styles from './style.module.css'

function App() {
  const {
    people,
    summary,
    addPerson,
    removePerson,
    updatePerson,
    addSale,
    updateSale,
    removeSale,
  } = useCommissionPeople()

  return (
    <div className={styles['app-shell']}>
      <Header />

      <main id="top" className={styles.main}>
        <Hero />
        <SummaryCards
          summary={summary}
          peopleCount={people.length}
          onExport={() => exportSummary(people)}
        />
        <CommissionSection
          people={people}
          onAddPerson={addPerson}
          onRemovePerson={removePerson}
          onUpdatePerson={updatePerson}
          onAddSale={addSale}
          onUpdateSale={updateSale}
          onRemoveSale={removeSale}
        />
      </main>

      <Footer />
    </div>
  )
}

export default App
