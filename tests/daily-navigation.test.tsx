import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../src/app'
import { todayInWorkTimeZone } from '../src/utils/history'
import type { Workspace } from '../src/types/workspace'

const mocks = vi.hoisted(() => ({
  pending: false,
  export: vi.fn(),
  team: { version: 1, people: [] } as Workspace,
  days: {} as Record<
    string,
    {
      version: number
      people: {
        id: string
        name: string
        percentage: number
        fixedAmount: number
        sales: { id: string; amount: number }[]
      }[]
    }
  >,
}))
vi.mock('../src/lib/supabase', () => ({ isSupabaseConfigured: true }))
vi.mock('../src/api/auth', () => ({
  useAuth: () => ({
    data: { id: 'owner', email: 'ana@example.com' },
    isPending: false,
  }),
  useSignOut: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('../src/api/workspace', () => ({
  useWorkspaceAutosave: () => ({
    status: 'Salvo na nuvem',
    hasUnsavedChanges: mocks.pending,
    retry: vi.fn(),
    reset: vi.fn(),
  }),
}))
vi.mock('../src/api/history', () => ({
  useHistory: () => ({ data: Object.keys(mocks.days).sort().reverse() }),
  useDay: (_ownerId: string, date: string) => ({
    data: mocks.days[date] ?? { version: 0, people: [] },
  }),
}))
vi.mock('../src/api/team', () => ({ useTeam: () => ({ data: mocks.team }) }))
vi.mock('../src/utils/export-summary', () => ({ exportSummary: mocks.export }))

Object.defineProperties(HTMLDialogElement.prototype, {
  showModal: { configurable: true, value() {} },
  close: { configurable: true, value() {} },
})

beforeEach(() => {
  // jsdom does not implement the native dialog lifecycle.
  vi.spyOn(HTMLDialogElement.prototype, 'showModal').mockImplementation(
    function () {
      this.setAttribute('open', '')
    },
  )
  vi.spyOn(HTMLDialogElement.prototype, 'close').mockImplementation(
    function () {
      this.removeAttribute('open')
    },
  )
  mocks.pending = false
  mocks.export.mockReset()
  mocks.team = {
    version: 1,
    people: [
      {
        id: 'ana',
        name: 'Ana atual',
        percentage: 30,
        fixedAmount: 75,
        sales: [],
      },
    ],
  }
  mocks.days = {
    '2026-09-10': {
      version: 1,
      people: [
        {
          id: 'ana',
          name: 'Ana',
          percentage: 10,
          fixedAmount: 33.33,
          sales: [{ id: 'sale', amount: 100 }],
        },
      ],
    },
    '2026-09-11': {
      version: 1,
      people: [
        {
          id: 'ana',
          name: 'Ana Maria',
          percentage: 20,
          fixedAmount: 50,
          sales: [{ id: 'sale', amount: 200 }],
        },
      ],
    },
  }
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('daily navigation', () => {
  it('creates empty member fields with placeholders and allows clearing numeric fields', () => {
    mocks.team = { people: [], version: 0 }
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Equipe', exact: true }))
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar membro' }))
    for (const [label, placeholder] of [
      ['Nome do membro 1', 'Digite o nome do membro'],
      ['Percentual do membro 1', 'Ex.: 10'],
      ['Valor fixo do membro 1', 'Ex.: 0,00'],
    ]) {
      const input = screen.getByLabelText(label) as HTMLInputElement
      expect(input.value).toBe('')
      expect(input.placeholder).toBe(placeholder)
    }
    const percentage = screen.getByLabelText(
      'Percentual do membro 1',
    ) as HTMLInputElement
    fireEvent.change(percentage, { target: { value: '20' } })
    fireEvent.change(percentage, { target: { value: '' } })
    expect(percentage.value).toBe('')
    fireEvent.change(percentage, { target: { value: '10' } })
    fireEvent.change(percentage, { target: { value: '10e' } })
    expect(percentage.value).toBe('10')
    fireEvent.change(percentage, { target: { value: '-5' } })
    expect(percentage.value).toBe('10')
    fireEvent.change(percentage, { target: { value: '10,5' } })
    expect(percentage.value).toBe('10,5')
    const fixed = screen.getByLabelText(
      'Valor fixo do membro 1',
    ) as HTMLInputElement
    fireEvent.change(fixed, { target: { value: '33,33' } })
    fireEvent.change(fixed, { target: { value: '33,33abc' } })
    expect(fixed.value).toBe('33,33')
  })

  it('opens one member at a time and discards the draft when the modal is closed', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Equipe', exact: true }))
    const add = screen.getByRole('button', { name: 'Adicionar membro' })
    fireEvent.click(add)
    const dialog = screen.getByRole('dialog', { name: 'Adicionar membro' })
    expect((add as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(add)
    expect(screen.getAllByLabelText(/Nome do membro/)).toHaveLength(1)
    expect(screen.queryByLabelText('Nome do membro 2')).toBeNull()
    fireEvent.change(screen.getByLabelText('Nome do membro 1'), {
      target: { value: 'Novo membro' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Fechar modal' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect((dialog as HTMLDialogElement).open).toBe(false)
    fireEvent.click(add)
    expect(
      (screen.getByLabelText('Nome do membro 1') as HTMLInputElement).value,
    ).toBe('')
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar alterações' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('opens editing in a modal and cancels changes with Escape', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Equipe', exact: true }))
    fireEvent.click(screen.getByRole('button', { name: 'Editar Ana atual' }))
    const dialog = screen.getByRole('dialog', { name: 'Editar membro' })
    fireEvent.change(screen.getByLabelText('Nome do membro 1'), {
      target: { value: 'Alteração descartada' },
    })
    fireEvent(dialog, new Event('cancel', { cancelable: true }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByRole('table').textContent).toContain('Ana atual')
    fireEvent.click(screen.getByRole('button', { name: 'Editar Ana atual' }))
    expect(
      (screen.getByLabelText('Nome do membro 1') as HTMLInputElement).value,
    ).toBe('Ana atual')
  })

  it('loads separate days, resets drafts on navigation and exports the selected date', () => {
    render(<App />)
    const date = screen.getByLabelText('Data de trabalho')
    expect((date as HTMLInputElement).value).toBe(todayInWorkTimeZone())
    fireEvent.change(date, { target: { value: '2026-09-10' } })
    expect(
      screen.getByRole('heading', { name: 'Ana', exact: true }),
    ).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Venda 01'), {
      target: { value: '150' },
    })
    fireEvent.change(screen.getByLabelText('Dias registrados'), {
      target: { value: '2026-09-11' },
    })
    expect(
      screen.getByRole('heading', { name: 'Ana Maria', exact: true }),
    ).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Exportar imagem/ }))
    expect(mocks.export).toHaveBeenCalledWith(
      mocks.days['2026-09-11'].people,
      '2026-09-11',
    )
  })

  it('edits the independent team and initializes new days from its saved rules without changing history', () => {
    const view = render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Equipe', exact: true }))
    expect(screen.queryByLabelText('Data de trabalho')).toBeNull()
    expect(screen.queryByLabelText('Nome do membro 1')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Editar Ana atual' }))
    fireEvent.change(screen.getByLabelText('Nome do membro 1'), {
      target: { value: 'Ana editada' },
    })
    fireEvent.change(screen.getByLabelText('Percentual do membro 1'), {
      target: { value: '40' },
    })
    fireEvent.change(screen.getByLabelText('Valor fixo do membro 1'), {
      target: { value: '80' },
    })
    const table = screen.getByRole('table')
    expect(table.textContent).toContain('Ana atual')
    expect(table.textContent).not.toContain('Ana editada')
    expect(screen.getByRole('button', { name: 'Salvar equipe' })).toBeTruthy()
    // Simulate the saved query data returned after confirmation.
    mocks.team = {
      version: 2,
      people: [
        {
          ...mocks.team.people[0],
          name: 'Ana editada',
          percentage: 40,
          fixedAmount: 80,
        },
      ],
    }
    view.rerender(<App />)
    expect(screen.queryByLabelText('Nome do membro 1')).toBeNull()
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(table.textContent).toContain('Ana editada')
    expect(table.textContent).toContain('40%')
    expect(table.textContent).toContain('80,00')
    fireEvent.click(
      screen.getByRole('button', { name: 'Comissões', exact: true }),
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Iniciar dia com a equipe' }),
    )
    expect(screen.getByRole('heading', { name: 'Ana editada' })).toBeTruthy()
    expect(screen.getByText('40%')).toBeTruthy()
    expect(screen.queryByLabelText('Nome do membro 1')).toBeNull()
    expect(screen.queryByLabelText('Venda 01')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar venda' }))
    fireEvent.change(screen.getByLabelText('Venda 01'), {
      target: { value: '100' },
    })
    fireEvent.change(screen.getByLabelText('Data de trabalho'), {
      target: { value: '2026-09-10' },
    })
    expect(
      screen.getByRole('heading', { name: 'Ana', exact: true }),
    ).toBeTruthy()
    expect(screen.getByText('10%')).toBeTruthy()
    expect(mocks.days['2026-09-10'].people[0].fixedAmount).toBe(33.33)
  })

  it('blocks every date control and sign out while edits are pending', () => {
    mocks.pending = true
    render(<App />)
    expect(
      (screen.getByLabelText('Data de trabalho') as HTMLInputElement).disabled,
    ).toBe(true)
    expect(
      (screen.getByLabelText('Dias registrados') as HTMLSelectElement).disabled,
    ).toBe(true)
    for (const name of ['Dia anterior', 'Próximo dia', 'Hoje', 'Sair']) {
      expect(
        (screen.getByRole('button', { name }) as HTMLButtonElement).disabled,
      ).toBe(true)
    }
    expect(
      screen.getByText('Aguarde o salvamento para trocar de dia.', {
        exact: false,
      }),
    ).toBeTruthy()
  })
})
