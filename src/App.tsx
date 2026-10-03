import './App.css'
import { AppFooter } from './components/AppFooter'
import { AppHeader } from './components/AppHeader'
import { CommissionSection } from './components/CommissionSection'
import { Hero } from './components/Hero'
import { SummaryCards } from './components/SummaryCards'
import { useCommissionPeople } from './hooks/useCommissionPeople'
import { exportSummary } from './utils/exportSummary'

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
    <div className="app-shell">
      <AppHeader />

      <main id="top">
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
