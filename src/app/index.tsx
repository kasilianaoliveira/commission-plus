import { useState } from 'react'
import { useAuth, useSignOut } from '../api/auth'
import { useWorkspace, useWorkspaceAutosave } from '../api/workspace'
import { AuthPanel } from '../components/auth-panel'
import { CommissionSection } from '../components/commission-section'
import { Footer } from '../components/footer'
import { Header } from '../components/header'
import { Hero } from '../components/hero'
import { PasswordUpdate } from '../components/password-update'
import { SummaryCards } from '../components/summary-cards'
import {
  loadLocalPeople,
  useCommissionPeople,
} from '../hooks/use-commission-people'
import { isSupabaseConfigured } from '../lib/supabase'
import type { CalculatorProps, CloudCalculatorProps } from '../types/workspace'
import { exportSummary } from '../utils/export-summary'
import styles from './style.module.css'

function CloudCalculator({ user }: CloudCalculatorProps) {
  const { data: workspace, error, isPending, refetch } = useWorkspace(user.id)

  if (error) {
    return (
      <main className={styles.cloudMessage}>
        <p role="alert">{error.message}</p>
        <button onClick={() => void refetch()}>Tentar novamente</button>
      </main>
    )
  }

  if (isPending) {
    return (
      <main className={styles.cloudMessage}>
        <p>Carregando sua equipe…</p>
      </main>
    )
  }

  return (
    <Calculator
      user={user}
      workspace={workspace}
    />
  )
}

function Calculator({ user, workspace }: CalculatorProps) {
  const {
    people,
    summary,
    addPerson,
    removePerson,
    updatePerson,
    addSale,
    updateSale,
    removeSale,
    replacePeople,
  } = useCommissionPeople(workspace.people)
  const {
    status,
    error: saveError,
    hasUnsavedChanges,
    retry,
  } = useWorkspaceAutosave(user.id, workspace, people)
  const {
    mutate: signOut,
    isPending: signingOut,
    error: signOutError,
  } = useSignOut()
  const [localPeople] = useState(loadLocalPeople)
  const cannotSignOut = signingOut || hasUnsavedChanges || Boolean(saveError)

  return (
    <div className={styles['app-shell']}>
      <Header />

      <div className={styles.accountBar}>
        <span>{user.email}</span>
        <span role="status">{status}</span>
        <button
          type="button"
          disabled={cannotSignOut}
          onClick={() => signOut()}
        >
          Sair
        </button>
      </div>

      {saveError && (
        <div
          className={styles.cloudError}
          role="alert"
        >
          {saveError.message} Seus dados continuam nesta tela. Copie-os antes de
          recarregar.{' '}
          <button
            type="button"
            onClick={retry}
          >
            Tentar salvar novamente
          </button>
        </div>
      )}

      {signOutError && (
        <div
          className={styles.cloudError}
          role="alert"
        >
          {signOutError.message}
        </div>
      )}

      {localPeople && people.length === 0 && (
        <div className={styles.importBar}>
          <span>Há dados da versão anterior neste navegador.</span>
          <button
            type="button"
            onClick={() => replacePeople(localPeople)}
          >
            Importar pessoas e vendas atuais
          </button>
        </div>
      )}

      <main
        id="top"
        className={styles.main}
      >
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

function App() {
  const {
    data: user,
    isPending: checking,
    error: authError,
    refetch,
    recovering,
    finishRecovery,
  } = useAuth()

  if (!isSupabaseConfigured) {
    return (
      <main className={styles.cloudMessage}>
        <h1>Configure o Supabase</h1>
        <p>
          Preencha VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no arquivo
          .env.local e reinicie o servidor.
        </p>
      </main>
    )
  }

  if (checking) {
    return (
      <main className={styles.cloudMessage}>
        <p>Verificando sessão…</p>
      </main>
    )
  }

  if (authError && !user) {
    return (
      <main className={styles.cloudMessage}>
        <p role="alert">{authError.message}</p>
        <button onClick={() => void refetch()}>Tentar novamente</button>
      </main>
    )
  }

  if (recovering && user) {
    return <PasswordUpdate onDone={finishRecovery} />
  }

  if (!user) {
    return <AuthPanel />
  }

  return (
    <CloudCalculator
      key={user.id}
      user={user}
    />
  )
}

export default App
