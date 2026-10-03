import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import type { PasswordFieldProps } from '../../types/password-field'
import { passwordRequirements } from '../../utils/password'
import styles from './style.module.css'

export function PasswordField({
  id,
  name,
  value,
  onChange,
  onBlur,
  inputRef,
  error,
  autoComplete,
  showRequirements = false,
}: Readonly<PasswordFieldProps>) {
  const [visible, setVisible] = useState(false)
  const descriptionIds = [
    showRequirements && `${id}-requirements`,
    error && `${id}-error`,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={styles.field}>
      <label htmlFor={id}>Senha</label>

      <div className={styles.inputWrap}>
        <input
          id={id}
          name={name}
          ref={inputRef}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          required
          value={value}
          aria-invalid={Boolean(error)}
          aria-describedby={descriptionIds || undefined}
          onBlur={onBlur}
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          type="button"
          className={styles.toggle}
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? (
            <EyeOff
              size={19}
              aria-hidden="true"
            />
          ) : (
            <Eye
              size={19}
              aria-hidden="true"
            />
          )}
        </button>
      </div>

      {error && (
        <span
          id={`${id}-error`}
          className={styles.error}
          role="alert"
        >
          {error}
        </span>
      )}

      {showRequirements && (
        <ul
          id={`${id}-requirements`}
          className={styles.requirements}
        >
          {passwordRequirements.map((requirement) => {
            const isMet = Boolean(value) && requirement.test(value)

            return (
              <li
                key={requirement.label}
                className={isMet ? styles.met : undefined}
              >
                <span aria-hidden="true">{isMet ? '✓' : '○'}</span>{' '}
                {requirement.label}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
