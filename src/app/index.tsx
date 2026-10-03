import styles from './style.module.css'
import { AppFooter } from '../components/app-footer'
import { AppHeader } from '../components/app-header'
import { CommissionSection } from '../components/commission-section'
import { Hero } from '../components/hero'
import { SummaryCards } from '../components/summary-cards'
import { useCommissionPeople } from '../hooks/useCommissionPeople'
import { exportSummary } from '../utils/exportSummary'

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
      <AppHeader />

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

      <AppFooter />
    </div>
  )
}

export default App
