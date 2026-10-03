import { createElement, type ReactNode } from 'react'
import { act, cleanup, renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useWorkspaceAutosave } from '../src/api/workspace'
import type { Workspace } from '../src/types/workspace'
import { useAuth } from '../src/api/auth'
import { dayKey, useDay } from '../src/api/history'
import { teamKey, useTeam } from '../src/api/team'
import { useTeamMembers } from '../src/hooks/use-team-members'

const backend = vi.hoisted(() => ({
  rpc: vi.fn(),
  getUser: vi.fn(),
  onAuthStateChange: vi.fn(),
}))
vi.mock('../src/lib/supabase', () => ({
  supabase: { rpc: backend.rpc, auth: backend },
}))

const clients: QueryClient[] = []
function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  clients.push(client)
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children)
  return { client, wrapper }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

const workspace: Workspace = {
  version: 4,
  people: [
    { id: 'ana', name: 'Ana', percentage: 10, fixedAmount: 0, sales: [] },
  ],
}
const editedPeople = (name: string) => [{ ...workspace.people[0], name }]
async function tick(milliseconds = 1) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(milliseconds)
  })
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.resetAllMocks()
})
afterEach(() => {
  cleanup()
  clients.splice(0).forEach((client) => client.clear())
  vi.useRealTimers()
})

describe('day autosave', () => {
  function editor() {
    const { client, wrapper } = setup()
    client.setQueryData(dayKey('owner', '2026-10-03'), workspace)
    const hook = renderHook(
      ({ people }) => {
        const { data } = useDay('owner', '2026-10-03')
        return useWorkspaceAutosave('owner', data!, people, '2026-10-03')
      },
      { wrapper, initialProps: { people: workspace.people } },
    )
    return { client, ...hook }
  }

  it('debounces edits and saves edits made during a request with the new version', async () => {
    const firstSave = deferred<{ data: number; error: null }>()
    backend.rpc
      .mockReturnValueOnce(firstSave.promise)
      .mockResolvedValue({ data: 6, error: null })
    const { result, rerender, client } = editor()
    await tick(700)
    expect(backend.rpc).not.toHaveBeenCalled()

    rerender({ people: editedPeople('Ana Maria') })
    await tick(400)
    rerender({ people: editedPeople('Ana Silva') })
    await tick(699)
    expect(backend.rpc).not.toHaveBeenCalled()
    await tick(2)
    expect(result.current.status).toBe('Salvando…')
    expect(backend.rpc).toHaveBeenNthCalledWith(1, 'save_manager_day', {
      selected_date: '2026-10-03',
      expected_version: 4,
      next_people: editedPeople('Ana Silva'),
    })

    rerender({ people: editedPeople('Ana Santos') })
    await tick(1000)
    expect(backend.rpc).toHaveBeenCalledTimes(1)
    await act(async () => {
      firstSave.resolve({ data: 5, error: null })
    })
    await tick()
    await tick(701)
    await tick()
    expect(backend.rpc).toHaveBeenNthCalledWith(2, 'save_manager_day', {
      selected_date: '2026-10-03',
      expected_version: 5,
      next_people: editedPeople('Ana Santos'),
    })
    expect(client.getQueryData(dayKey('owner', '2026-10-03'))).toEqual({
      version: 6,
      people: editedPeople('Ana Santos'),
    })
    expect(result.current.status).toBe('Salvo na nuvem')
    expect(result.current.hasUnsavedChanges).toBe(false)
  })

  it('keeps the draft and stops after a conflict until explicitly retried', async () => {
    backend.rpc
      .mockResolvedValueOnce({
        data: null,
        error: new Error('Conflito de versão'),
      })
      .mockResolvedValueOnce({ data: 5, error: null })
    const { result, rerender, client } = editor()
    rerender({ people: editedPeople('Ana Maria') })
    await tick(701)
    await tick()
    expect(result.current.status).toBe('Falha ao salvar')
    expect(result.current.hasUnsavedChanges).toBe(true)
    expect(client.getQueryData(dayKey('owner', '2026-10-03'))).toEqual(
      workspace,
    )
    await tick(5000)
    expect(backend.rpc).toHaveBeenCalledTimes(1)

    act(() => result.current.retry())
    await tick(701)
    await tick()
    expect(backend.rpc).toHaveBeenCalledTimes(2)
    expect(result.current.status).toBe('Salvo na nuvem')
  })

  it('warns before leaving with unsaved edits and cancels the debounce on unmount', async () => {
    const { rerender, unmount } = editor()
    const savedEvent = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(savedEvent)
    expect(savedEvent.defaultPrevented).toBe(false)
    rerender({ people: editedPeople('Ana Maria') })
    const unsavedEvent = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(unsavedEvent)
    expect(unsavedEvent.defaultPrevented).toBe(true)
    unmount()
    await tick(1000)
    expect(backend.rpc).not.toHaveBeenCalled()
    const unmountedEvent = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(unmountedEvent)
    expect(unmountedEvent.defaultPrevented).toBe(false)
  })
})

describe('team registry autosave', () => {
  it('clears the form only after saving and preserves other members when editing one row', async () => {
    const { client, wrapper } = setup()
    const other = { ...workspace.people[0], id: 'lucas', name: 'Lucas' }
    client.setQueryData(teamKey('owner'), {
      ...workspace,
      people: [...workspace.people, other],
    })
    backend.rpc
      .mockResolvedValueOnce({ data: null, error: new Error('Sem conexão') })
      .mockResolvedValueOnce({ data: 5, error: null })
    const { result } = renderHook(
      () => {
        const { data } = useTeam('owner')
        const editor = useTeamMembers(data!.people, data!.version)
        const save = useWorkspaceAutosave(
          'owner',
          data!,
          editor.people,
          undefined,
          false,
        )
        return { editor, save }
      },
      { wrapper },
    )
    expect(result.current.editor.drafts).toHaveLength(0)
    act(() => result.current.editor.editPerson('ana'))
    act(() => result.current.editor.updatePerson('ana', 'name', 'Ana editada'))
    act(() => result.current.save.save())
    await tick()
    expect(result.current.editor.drafts[0].name).toBe('Ana editada')
    expect(result.current.save.error).toBeTruthy()
    act(() => result.current.save.retry())
    await tick()
    expect(result.current.editor.drafts).toHaveLength(0)
    expect(result.current.save.hasUnsavedChanges).toBe(false)
    expect(result.current.editor.people).toHaveLength(2)
    expect(result.current.editor.people).toContainEqual(other)
    expect(
      result.current.editor.people.find((person) => person.id === 'ana')?.name,
    ).toBe('Ana editada')
    act(() => result.current.editor.addPerson())
    expect(result.current.editor.drafts[0].name).toBe('')
    act(() => result.current.editor.discardChanges())
    expect(result.current.editor.drafts).toHaveLength(0)
    expect(result.current.save.hasUnsavedChanges).toBe(false)
  })

  it('waits for confirmation, keeps the saved team on failure and retries explicitly', async () => {
    const { client, wrapper } = setup()
    client.setQueryData(teamKey('owner'), workspace)
    backend.rpc
      .mockResolvedValueOnce({
        data: null,
        error: new Error('Falha de conexão'),
      })
      .mockResolvedValueOnce({ data: 5, error: null })
    const draft = editedPeople('Ana confirmada')
    const { result } = renderHook(
      () => {
        const { data } = useTeam('owner')
        return useWorkspaceAutosave('owner', data!, draft, undefined, false)
      },
      { wrapper },
    )
    await tick(2000)
    expect(backend.rpc).not.toHaveBeenCalled()
    expect(result.current.canSave).toBe(true)
    act(() => result.current.save())
    await tick()
    expect(result.current.status).toBe('Falha ao salvar')
    expect(client.getQueryData(teamKey('owner'))).toEqual(workspace)
    await tick(2000)
    expect(backend.rpc).toHaveBeenCalledTimes(1)
    act(() => result.current.retry())
    await tick()
    expect(client.getQueryData(teamKey('owner'))).toEqual({
      people: draft,
      version: 5,
    })
    expect(result.current.hasUnsavedChanges).toBe(false)
  })

  it('saves the team without a date or sales and leaves daily history unchanged', async () => {
    const { client, wrapper } = setup()
    client.setQueryData(teamKey('owner'), { people: [], version: 0 })
    client.setQueryData(dayKey('owner', '2026-10-02'), workspace)
    backend.rpc.mockResolvedValue({ data: 1, error: null })
    const draft = editedPeople('Ana cadastrada')
    const { result } = renderHook(
      () => {
        const { data } = useTeam('owner')
        return useWorkspaceAutosave('owner', data!, draft)
      },
      { wrapper },
    )
    await tick(701)
    await tick()
    expect(backend.rpc).toHaveBeenCalledWith('save_manager_team', {
      expected_version: 0,
      next_members: [
        { id: 'ana', name: 'Ana cadastrada', percentage: 10, fixedAmount: 0 },
      ],
    })
    expect(result.current.hasUnsavedChanges).toBe(false)
    expect(client.getQueryData(dayKey('owner', '2026-10-02'))).toEqual(
      workspace,
    )
    expect(client.getQueryData(teamKey('owner'))).toEqual({
      people: draft,
      version: 1,
    })
  })

  it('rejects an unnamed member without writing to the database', async () => {
    const { client, wrapper } = setup()
    client.setQueryData(teamKey('owner'), workspace)
    const { result } = renderHook(
      () => {
        const { data } = useTeam('owner')
        return useWorkspaceAutosave('owner', data!, editedPeople('   '))
      },
      { wrapper },
    )
    await tick(701)
    await tick()
    expect(backend.rpc).not.toHaveBeenCalled()
    expect(result.current.hasUnsavedChanges).toBe(true)
    expect(result.current.status).toContain('Preencha nome')
  })
})

describe('daily autosave', () => {
  it('creates a date with version zero, stores numeric amounts and isolates other dates', async () => {
    const { client, wrapper } = setup()
    const date = '2026-10-03'
    const empty: Workspace = { people: [], version: 0 }
    client.setQueryData(dayKey('owner', date), empty)
    client.setQueryData(dayKey('owner', '2026-10-02'), workspace)
    backend.rpc.mockResolvedValue({ data: 1, error: null })
    const draft = [
      { ...workspace.people[0], sales: [{ id: 'sale', amount: '123.45' }] },
    ]
    const { result } = renderHook(
      () => {
        const { data } = useDay('owner', date)
        return useWorkspaceAutosave('owner', data!, draft, date)
      },
      { wrapper },
    )
    await tick(701)
    await tick()
    expect(backend.rpc).toHaveBeenCalledWith('save_manager_day', {
      selected_date: date,
      expected_version: 0,
      next_people: [{ ...draft[0], sales: [{ id: 'sale', amount: 123.45 }] }],
    })
    expect(result.current.hasUnsavedChanges).toBe(false)
    expect(client.getQueryData(dayKey('owner', '2026-10-02'))).toEqual(
      workspace,
    )
  })

  it('retains edits made while a daily save is running and uses the returned version', async () => {
    const { client, wrapper } = setup()
    const date = '2026-10-03'
    client.setQueryData(dayKey('owner', date), workspace)
    const first = deferred<{ data: number; error: null }>()
    backend.rpc
      .mockReturnValueOnce(first.promise)
      .mockResolvedValue({ data: 6, error: null })
    const { result, rerender } = renderHook(
      ({ people }) => {
        const { data } = useDay('owner', date)
        return useWorkspaceAutosave('owner', data!, people, date)
      },
      { wrapper, initialProps: { people: editedPeople('Primeiro nome') } },
    )
    await tick(701)
    rerender({ people: editedPeople('Nome corrigido') })
    await act(async () => first.resolve({ data: 5, error: null }))
    await tick()
    expect(client.getQueryData(dayKey('owner', date))).toEqual({
      people: editedPeople('Primeiro nome'),
      version: 5,
    })
    expect(result.current.hasUnsavedChanges).toBe(true)
    await tick(701)
    await tick()
    expect(backend.rpc).toHaveBeenLastCalledWith('save_manager_day', {
      selected_date: date,
      expected_version: 5,
      next_people: editedPeople('Nome corrigido'),
    })
    expect(result.current.hasUnsavedChanges).toBe(false)
  })
})

it('a newer auth event wins over the initial lookup and signing out clears workspace data', async () => {
  const lookup = deferred<{ data: { user: null }; error: null }>()
  backend.getUser.mockReturnValue(lookup.promise)
  const unsubscribe = vi.fn()
  backend.onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe } },
  })
  const { client, wrapper } = setup()
  const { result, unmount } = renderHook(() => useAuth(), { wrapper })
  const listener = backend.onAuthStateChange.mock.calls[0][0]
  const user = { id: 'owner', email: 'ana@example.com' }
  act(() => listener('SIGNED_IN', { user }))
  await tick()
  await act(async () => {
    lookup.resolve({ data: { user: null }, error: null })
  })
  await tick()
  expect(result.current.data).toEqual(user)
  expect(result.current.isPending).toBe(false)

  client.setQueryData(dayKey('owner', '2026-10-03'), workspace)
  client.setQueryData(teamKey('owner'), workspace)
  act(() => listener('PASSWORD_RECOVERY', { user }))
  expect(result.current.recovering).toBe(true)
  act(() => listener('SIGNED_OUT', null))
  await tick()
  expect(result.current.data).toBeNull()
  expect(result.current.recovering).toBe(false)
  expect(client.getQueryData(dayKey('owner', '2026-10-03'))).toBeUndefined()
  expect(client.getQueryData(teamKey('owner'))).toBeUndefined()
  unmount()
  expect(unsubscribe).toHaveBeenCalledOnce()
})
