import { createElement, type ReactNode } from 'react'
import { act, cleanup, renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useWorkspace, useWorkspaceAutosave } from '../src/api/workspace'
import type { Workspace } from '../src/types/workspace'
import { useAuth } from '../src/api/auth'

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

describe('workspace autosave', () => {
  function editor() {
    const { client, wrapper } = setup()
    client.setQueryData(['workspace', 'owner'], workspace)
    const hook = renderHook(
      ({ people }) => {
        const { data } = useWorkspace('owner')
        return useWorkspaceAutosave('owner', data!, people)
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
    expect(backend.rpc).toHaveBeenNthCalledWith(1, 'save_manager_workspace', {
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
    expect(backend.rpc).toHaveBeenNthCalledWith(2, 'save_manager_workspace', {
      expected_version: 5,
      next_people: editedPeople('Ana Santos'),
    })
    expect(client.getQueryData(['workspace', 'owner'])).toEqual({
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
    expect(client.getQueryData(['workspace', 'owner'])).toEqual(workspace)
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

  client.setQueryData(['workspace', 'owner'], workspace)
  act(() => listener('PASSWORD_RECOVERY', { user }))
  expect(result.current.recovering).toBe(true)
  act(() => listener('SIGNED_OUT', null))
  await tick()
  expect(result.current.data).toBeNull()
  expect(result.current.recovering).toBe(false)
  expect(client.getQueryData(['workspace', 'owner'])).toBeUndefined()
  unmount()
  expect(unsubscribe).toHaveBeenCalledOnce()
})
