import type { Ref } from 'react'

export type PasswordFieldProps = {
  id: string
  name: string
  value: string
  onChange: (value: string) => void
  onBlur: () => void
  inputRef: Ref<HTMLInputElement>
  error?: string
  autoComplete: 'current-password' | 'new-password'
  showRequirements?: boolean
}
