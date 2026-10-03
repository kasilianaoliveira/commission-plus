import { Controller, useForm } from 'react-hook-form'
import { usePasswordUpdate } from '../../api/auth'
import type { PasswordFields, PasswordUpdateProps } from '../../types/auth'
import { isValidPassword } from '../../utils/password'
import { PasswordField } from '../password-field'
import styles from './style.module.css'

const passwordRules = {
  required: 'Informe a nova senha.',
  validate: (password: string) =>
    isValidPassword(password) ||
    'Use 8 caracteres, maiúscula, minúscula e número.',
}

export function PasswordUpdate({ onDone }: Readonly<PasswordUpdateProps>) {
  const { mutate: updatePassword, error, isPending } = usePasswordUpdate(onDone)
  const { control, handleSubmit } = useForm<PasswordFields>({
    mode: 'onChange',
    defaultValues: {
      password: '',
    },
  })

  const onSubmit = handleSubmit(({ password }) => {
    updatePassword(password)
  })

  return (
    <main className={styles.page}>
      <form
        className={styles.card}
        onSubmit={onSubmit}
        noValidate
      >
        <span className={styles.brand}>Comissão+</span>
        <h1>Nova senha</h1>

        <Controller
          name="password"
          control={control}
          rules={passwordRules}
          render={({ field, fieldState }) => (
            <PasswordField
              id="new-password"
              name={field.name}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              inputRef={field.ref}
              error={fieldState.error?.message}
              autoComplete="new-password"
              showRequirements
            />
          )}
        />

        {error && (
          <p
            role="alert"
            className={styles.error}
          >
            {error.message}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
        >
          {isPending ? 'Salvando…' : 'Salvar senha'}
        </button>
      </form>
    </main>
  )
}
