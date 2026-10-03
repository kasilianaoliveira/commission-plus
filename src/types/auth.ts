export type AuthMode = 'login' | 'signup' | 'reset'

export type AuthFields = { email: string; password: string }

export type AuthAction = AuthFields & { mode: AuthMode }

export type PasswordFields = { password: string }

export type PasswordUpdateProps = { onDone: () => void }
