import { useEffect, useRef, useState } from 'react'
import { Pencil, Plus, Save, Trash2, Users, X } from 'lucide-react'
import type { TeamSectionProps } from '../../types/team-section'
import { currency } from '../../utils/commission'
import styles from './style.module.css'

export function TeamSection({
  people,
  savedPeople,
  canSave,
  isSaving,
  hasChanges,
  saveStatus,
  saveError,
  onSave,
  onCancel,
  onAddPerson,
  onEditPerson,
  onRemovePerson,
  onUpdatePerson,
}: TeamSectionProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [mode, setMode] = useState<'add' | 'edit' | 'delete'>('add')
  const isOpen = people.length > 0 || hasChanges
  const person = people[0]
  const title =
    mode === 'add'
      ? 'Adicionar membro'
      : mode === 'delete'
        ? 'Excluir membro'
        : 'Editar membro'

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (isOpen && !dialog.open) dialog.showModal()
    if (!isOpen && dialog.open) dialog.close()
  }, [isOpen])

  return (
    <section
      className={styles.section}
      aria-label="Cadastro da equipe"
    >
      <div className={styles.heading}>
        <div>
          <h2>Minha equipe</h2>
          <p>
            Adicione ou edite um membro por vez. As alterações serão usadas ao
            iniciar novos dias e preservam os dias já registrados.
          </p>
        </div>
        <button
          type="button"
          disabled={isSaving || isOpen}
          onClick={() => {
            setMode('add')
            onAddPerson()
          }}
        >
          <Plus size={18} /> Adicionar membro
        </button>
      </div>
      {people.length === 0 && savedPeople.length === 0 && (
        <div className={styles.empty}>
          <Users size={28} />
          <h3>Sua equipe ainda está vazia</h3>
          <p>Adicione o primeiro membro para começar.</p>
        </div>
      )}
      <dialog
        ref={dialogRef}
        className={styles.modal}
        aria-labelledby="team-member-modal-title"
        onCancel={(event) => {
          event.preventDefault()
          if (!isSaving) onCancel()
        }}
      >
        <div className={styles.modalHeading}>
          <h3 id="team-member-modal-title">{title}</h3>
          <button
            type="button"
            className={styles.close}
            aria-label="Fechar modal"
            disabled={isSaving}
            onClick={onCancel}
          >
            <X size={20} />
          </button>
        </div>
        {isOpen && (
          <form
            onSubmit={(event) => {
              event.preventDefault()
              if (canSave) onSave()
            }}
          >
            <fieldset
              className={styles.list}
              disabled={isSaving}
            >
              {person ? (
                <article
                  key={person.id}
                  className={styles.member}
                >
                  <label>
                    Nome do membro
                    <input
                      aria-label="Nome do membro 1"
                      maxLength={1000}
                      required
                      autoFocus
                      placeholder="Digite o nome do membro"
                      value={person.name}
                      onChange={(event) =>
                        onUpdatePerson(person.id, 'name', event.target.value)
                      }
                    />
                  </label>
                  <label>
                    Percentual (%)
                    <input
                      aria-label="Percentual do membro 1"
                      type="text"
                      inputMode="decimal"
                      required
                      pattern="[0-9]*([.,][0-9]{0,2})?"
                      placeholder="Ex.: 10"
                      value={person.percentage}
                      onChange={(event) =>
                        onUpdatePerson(
                          person.id,
                          'percentage',
                          event.target.value,
                        )
                      }
                    />
                  </label>
                  <label>
                    Valor fixo (R$)
                    <input
                      aria-label="Valor fixo do membro 1"
                      type="text"
                      inputMode="decimal"
                      required
                      pattern="[0-9]*([.,][0-9]{0,2})?"
                      placeholder="Ex.: 0,00"
                      value={person.fixedAmount}
                      onChange={(event) =>
                        onUpdatePerson(
                          person.id,
                          'fixedAmount',
                          event.target.value,
                        )
                      }
                    />
                  </label>
                </article>
              ) : (
                <p>Confirme para remover este membro da equipe cadastrada.</p>
              )}
            </fieldset>
            {saveError && <p role="alert">{saveError}</p>}
            <div className={styles.actions}>
              <p
                role="status"
                aria-live="polite"
              >
                {hasChanges
                  ? `${saveStatus}. Confirme para atualizar a equipe cadastrada.`
                  : savedPeople.length > 0
                    ? 'Equipe salva na nuvem.'
                    : 'Adicione membros e salve para cadastrar sua equipe.'}
              </p>
              <div className={styles.actionButtons}>
                <button
                  type="button"
                  className={styles.cancel}
                  disabled={isSaving}
                  onClick={onCancel}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!canSave}
                >
                  <Save size={18} /> {isSaving ? 'Salvando…' : 'Salvar equipe'}
                </button>
              </div>
            </div>
          </form>
        )}
      </dialog>
      <div className={styles.registry}>
        <h3>Equipe cadastrada</h3>
        {people.length === 0 && !hasChanges && savedPeople.length > 0 && (
          <p role="status">Equipe salva na nuvem.</p>
        )}
        <p>Os membros salvos abaixo serão usados ao iniciar novos dias.</p>
        {savedPeople.length === 0 ? (
          <p>Nenhum membro salvo ainda.</p>
        ) : (
          <div className={styles.tableWrapper}>
            <table>
              <caption className={styles.tableCaption}>
                Membros e regras de comissão salvos
              </caption>
              <thead>
                <tr>
                  <th scope="col">Nome do membro</th>
                  <th scope="col">Percentual</th>
                  <th scope="col">Valor fixo</th>
                  <th scope="col">Ações</th>
                </tr>
              </thead>
              <tbody>
                {savedPeople.map((person) => (
                  <tr key={person.id}>
                    <th scope="row">{person.name}</th>
                    <td>
                      {Number(person.percentage).toLocaleString('pt-BR')}%
                    </td>
                    <td>{currency.format(Number(person.fixedAmount))}</td>
                    <td>
                      <div className={styles.rowActions}>
                        <button
                          type="button"
                          disabled={isSaving || isOpen}
                          aria-label={`Editar ${person.name}`}
                          onClick={() => {
                            setMode('edit')
                            onEditPerson(person.id)
                          }}
                        >
                          <Pencil size={16} /> Editar
                        </button>
                        <button
                          type="button"
                          className={styles.delete}
                          disabled={isSaving || isOpen}
                          aria-label={`Excluir ${person.name} da equipe`}
                          onClick={() => {
                            setMode('delete')
                            onRemovePerson(person.id)
                          }}
                        >
                          <Trash2 size={16} /> Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
