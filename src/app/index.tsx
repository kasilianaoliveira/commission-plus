import { useState } from 'react'
import { useAuth, useSignOut } from '../api/auth'
import { useWorkspaceAutosave } from '../api/workspace'
import { useDay, useHistory } from '../api/history'
import { useTeam } from '../api/team'
import { TeamSection } from '../components/team-section'
import { AuthPanel } from '../components/auth-panel'
import { CommissionSection } from '../components/commission-section'
import { Footer } from '../components/footer'
import { Header } from '../components/header'
import { Hero } from '../components/hero'
import { PasswordUpdate } from '../components/password-update'
import { SummaryCards } from '../components/summary-cards'
import { useCommissionPeople } from '../hooks/use-commission-people'
import { useTeamMembers } from '../hooks/use-team-members'
import { isSupabaseConfigured } from '../lib/supabase'
import type { CalculatorProps, CloudCalculatorProps } from '../types/workspace'
import { exportSummary } from '../utils/export-summary'
import {
  formatWorkDate,
  isWorkDate,
  normalizeDailyPeople,
  shiftWorkDate,
  startDay,
  todayInWorkTimeZone,
} from '../utils/history'
import styles from './style.module.css'

function CloudCalculator({ user }: CloudCalculatorProps) {
  const [date, setDate] = useState(todayInWorkTimeZone)
  const history = useHistory(user.id)
  const day = useDay(user.id, date)
  const team = useTeam(user.id)
  const error = team.error ?? day.error ?? (history.data ? null : history.error)

  if (error) {
    return (
      <main className={styles.cloudMessage}>
        <p role="alert">{error.message}</p>
        <p>
          Confira se as migrações de equipe e histórico diário foram aplicadas
          no Supabase.
        </p>
        <button
          onClick={() => {
            void history.refetch()
            void day.refetch()
            void team.refetch()
          }}
        >
          Tentar novamente
        </button>
      </main>
    )
  }

  if (!history.data || !day.data || !team.data) {
    return (
      <main className={styles.cloudMessage}>
        <p>Carregando sua equipe…</p>
      </main>
    )
  }

  return (
    <Calculator
      key={date}
      user={user}
      workspace={day.data}
      team={team.data}
      date={date}
      dates={history.data}
      onDateChange={setDate}
    />
  )
}

function Calculator({
  user,
  workspace,
  team,
  date,
  dates,
  onDateChange,
}: CalculatorProps) {
  const { people, summary, addSale, updateSale, removeSale, replacePeople } =
    useCommissionPeople(workspace.people)
  const teamEditor = useTeamMembers(team.people, team.version)
  const teamSave = useWorkspaceAutosave(
    user.id,
    team,
    teamEditor.people,
    undefined,
    false,
  )
  const [tab, setTab] = useState<'team' | 'commissions'>('commissions')
  const {
    status,
    error: saveError,
    hasUnsavedChanges,
    retry,
  } = useWorkspaceAutosave(user.id, workspace, people, date)
  const {
    mutate: signOut,
    isPending: signingOut,
    error: signOutError,
  } = useSignOut()
  const [startDayError, setStartDayError] = useState('')
  const cannotSignOut =
    signingOut ||
    hasUnsavedChanges ||
    teamSave.hasUnsavedChanges ||
    Boolean(saveError) ||
    Boolean(teamSave.error)
  const changeDate = (nextDate: string) => {
    if (!cannotSignOut && isWorkDate(nextDate)) onDateChange(nextDate)
  }
  const prepareDay = (source: typeof people) => {
    try {
      replacePeople(normalizeDailyPeople(source))
      setStartDayError('')
    } catch (error) {
      setStartDayError(
        error instanceof Error
          ? error.message
          : 'Não foi possível iniciar este dia.',
      )
    }
  }

  return (
    <div className={styles['app-shell']}>
      <Header />

      <div className={styles.accountBar}>
        <span>{user.email}</span>
        <span role="status">
          {tab === 'team'
            ? teamSave.status
            : workspace.version === 0 && !hasUnsavedChanges
              ? 'Dia sem registros'
              : status}
        </span>
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

      {teamSave.error && (
        <div
          className={styles.cloudError}
          role="alert"
        >
          {teamSave.error.message} As alterações da equipe continuam nesta tela.
          <button
            type="button"
            onClick={teamSave.retry}
          >
            Tentar salvar equipe novamente
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

      <main
        id="top"
        className={styles.main}
      >
        <Hero />
        <nav
          className={styles.tabs}
          aria-label="Áreas da aplicação"
        >
          <button
            type="button"
            aria-current={tab === 'team' ? 'page' : undefined}
            disabled={cannotSignOut && tab !== 'team'}
            onClick={() => setTab('team')}
          >
            Equipe
          </button>
          <button
            type="button"
            aria-current={tab === 'commissions' ? 'page' : undefined}
            disabled={cannotSignOut && tab !== 'commissions'}
            onClick={() => setTab('commissions')}
          >
            Comissões
          </button>
        </nav>
        {tab === 'team' ? (
          <TeamSection
            people={teamEditor.drafts}
            savedPeople={team.people}
            canSave={teamSave.canSave}
            isSaving={teamSave.isPending}
            hasChanges={teamSave.hasUnsavedChanges}
            saveStatus={teamSave.status}
            saveError={teamSave.error?.message}
            onSave={teamSave.save}
            onCancel={() => {
              teamEditor.discardChanges()
              teamSave.reset()
            }}
            onAddPerson={teamEditor.addPerson}
            onEditPerson={teamEditor.editPerson}
            onRemovePerson={teamEditor.removePerson}
            onUpdatePerson={teamEditor.updatePerson}
          />
        ) : (
          <>
            {startDayError && <p role="alert">{startDayError}</p>}
            <section
              className={styles.dateBar}
              aria-label="Histórico diário"
            >
              <h2>Histórico diário</h2>
              <div className={styles.dateControls}>
                <button
                  type="button"
                  disabled={cannotSignOut || date === '1900-01-01'}
                  onClick={() => changeDate(shiftWorkDate(date, -1))}
                >
                  Dia anterior
                </button>
                <label>
                  Data de trabalho
                  <input
                    type="date"
                    min="1900-01-01"
                    max="9999-12-31"
                    value={date}
                    disabled={cannotSignOut}
                    onChange={(event) => changeDate(event.target.value)}
                  />
                </label>
                <button
                  type="button"
                  disabled={cannotSignOut || date === '9999-12-31'}
                  onClick={() => changeDate(shiftWorkDate(date, 1))}
                >
                  Próximo dia
                </button>
                <button
                  type="button"
                  disabled={cannotSignOut}
                  onClick={() => changeDate(todayInWorkTimeZone())}
                >
                  Hoje
                </button>
                <label>
                  Dias registrados
                  <select
                    value={dates.includes(date) ? date : ''}
                    disabled={cannotSignOut}
                    onChange={(event) => changeDate(event.target.value)}
                  >
                    <option value="">Selecionar um dia</option>
                    {dates.map((savedDate) => (
                      <option
                        key={savedDate}
                        value={savedDate}
                      >
                        {formatWorkDate(savedDate)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <p>
                {formatWorkDate(date)} · Fuso America/Sao_Paulo.{' '}
                {hasUnsavedChanges
                  ? 'Aguarde o salvamento para trocar de dia.'
                  : 'Cada dia mantém suas próprias pessoas, vendas e regras.'}
              </p>
              {date < todayInWorkTimeZone() && (
                <p>
                  Você está corrigindo um dia anterior. Alterações nesta tela
                  afetam apenas {formatWorkDate(date)}.
                </p>
              )}
              {workspace.version === 0 && people.length === 0 && (
                <div>
                  <p>
                    Este dia ainda não tem registros. Inicie com os membros e as
                    regras cadastrados na aba Equipe. O valor fixo é aplicado ao
                    iniciar o dia.
                  </p>
                  {team.people.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => prepareDay(startDay(team.people))}
                    >
                      Iniciar dia com a equipe
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setTab('team')}
                    >
                      Cadastrar equipe
                    </button>
                  )}
                </div>
              )}
            </section>
            <SummaryCards
              summary={summary}
              peopleCount={people.length}
              onExport={() => exportSummary(people, date)}
            />
            <CommissionSection
              people={people}
              onAddSale={addSale}
              onUpdateSale={updateSale}
              onRemoveSale={removeSale}
            />
          </>
        )}
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
