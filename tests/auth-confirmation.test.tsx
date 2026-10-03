import { useState } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AuthPanel } from '../src/components/auth-panel'

vi.mock('../src/api/auth', () => ({
  useAuthAction: function useAuthAction() {
    const [message, setMessage] = useState('')
    return {
      mutate: () =>
        setMessage(
          'Se este e-mail ainda não tiver conta, você receberá uma confirmação. Se já tiver, entre ou recupere sua senha.',
        ),
      data: message,
      error: null,
      isPending: false,
      reset: () => setMessage(''),
    }
  },
}))

afterEach(cleanup)

async function submitSignup() {
  render(<AuthPanel />)
  fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }))
  fireEvent.change(screen.getByLabelText('E-mail'), {
    target: { value: 'ana@example.com' },
  })
  fireEvent.change(screen.getByLabelText('Senha'), {
    target: { value: 'Password123' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }))
  await screen.findByRole('heading', { name: 'Confira seu e-mail' })
}

describe('confirmação de cadastro', () => {
  it('mostra o endereço e orientações sem prometer envio para uma conta existente', async () => {
    await submitSignup()
    expect(screen.getByText('ana@example.com')).toBeTruthy()
    expect(
      screen.getByText(/Se este endereço ainda não tiver uma conta/),
    ).toBeTruthy()
    expect(screen.getByText(/spam ou lixo eletrônico/)).toBeTruthy()
    expect(screen.getByRole('status').textContent).toContain('Se já tiver')
  })

  it.each([
    ['Ir para o login', 'Entrar'],
    ['recupere sua senha', 'Recuperar senha'],
    ['Usar outro e-mail', 'Criar conta'],
  ])('permite continuar por %s mantendo o e-mail', async (action, heading) => {
    await submitSignup()
    fireEvent.click(screen.getByRole('button', { name: action }))
    expect(screen.getByRole('heading', { name: heading })).toBeTruthy()
    expect((screen.getByLabelText('E-mail') as HTMLInputElement).value).toBe(
      'ana@example.com',
    )
    expect(screen.queryByRole('status')).toBeNull()
    if (heading !== 'Recuperar senha') {
      expect((screen.getByLabelText('Senha') as HTMLInputElement).value).toBe(
        '',
      )
    }
  })
})
