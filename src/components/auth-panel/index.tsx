import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useAuthAction } from '../../api/auth'
import type { AuthFields, AuthMode } from '../../types/auth'
import { isValidPassword } from '../../utils/password'
import { PasswordField } from '../password-field'
import styles from './style.module.css'

const modeLabels = {
  login: { title: 'Entrar', submit: 'Entrar' },
  signup: { title: 'Criar conta', submit: 'Criar conta' },
  reset: { title: 'Recuperar senha', submit: 'Enviar e-mail' },
}

const emailRules = {
  required: 'Informe seu e-mail.',
  pattern: {
    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Informe um e-mail válido.',
  },
}

const passwordRules = {
  required: 'Informe sua senha.',
}

const signupPasswordRules = {
  ...passwordRules,
  validate: (password: string) =>
    isValidPassword(password) ||
    'Use 8 caracteres, maiúscula, minúscula e número.',
}

export function AuthPanel() {
  const [mode, setMode] = useState<AuthMode>('login')
  const {
    mutate: authenticate,
    data: message,
    error,
    isPending,
    reset: resetAction,
  } = useAuthAction()
  const {
    register,
    control,
    handleSubmit,
    reset,
    getValues,
    formState: { errors },
  } = useForm<AuthFields>({
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
    },
  })
  const labels = modeLabels[mode]

  function changeMode(next: AuthMode) {
    const email = getValues('email')
    setMode(next)
    reset({ email, password: '' })
    resetAction()
  }

  const onSubmit = handleSubmit(({ email, password }) => {
    authenticate({ mode, email, password })
  })

  if (mode === 'signup' && message) {
    return (
      <main className={styles.page}>
        <div className={styles.card}>
          <p
            role="status"
            className={styles.success}
          >
            {message}
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.page}>
      <form
        className={styles.card}
        onSubmit={onSubmit}
        noValidate
      >
        <span className={styles.brand}>Comissão+</span>
        <h1>{labels.title}</h1>
        <p>Acesse sua equipe e suas comissões.</p>

        <label htmlFor="account-email">
          E-mail
          <input
            id="account-email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'email-error' : undefined}
            {...register('email', emailRules)}
          />
        </label>

        {errors.email && (
          <span
            id="email-error"
            className={styles.error}
            role="alert"
          >
            {errors.email.message}
          </span>
        )}

        {mode !== 'reset' && (
          <Controller
            key={mode}
            name="password"
            control={control}
            rules={mode === 'signup' ? signupPasswordRules : passwordRules}
            render={({ field, fieldState }) => (
              <PasswordField
                id="account-password"
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                inputRef={field.ref}
                error={fieldState.error?.message}
                autoComplete={
                  mode === 'login' ? 'current-password' : 'new-password'
                }
                showRequirements={mode === 'signup'}
              />
            )}
          />
        )}

        {error && (
          <p
            role="alert"
            className={styles.error}
          >
            {error.message}
          </p>
        )}

        {message && (
          <p
            role="status"
            className={styles.success}
          >
            {message}
          </p>
        )}

        <button
          disabled={isPending}
          type="submit"
        >
          {isPending ? 'Aguarde…' : labels.submit}
        </button>

        <div className={styles.links}>
          <button
            type="button"
            disabled={isPending}
            onClick={() => changeMode(mode === 'signup' ? 'login' : 'signup')}
          >
            {mode === 'signup' ? 'Já tenho conta' : 'Criar conta'}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => changeMode(mode === 'reset' ? 'login' : 'reset')}
          >
            {mode === 'reset' ? 'Voltar ao login' : 'Esqueci minha senha'}
          </button>
        </div>
      </form>
    </main>
  )
}
