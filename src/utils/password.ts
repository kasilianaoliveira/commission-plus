export const passwordRequirements = [
  {
    label: 'Pelo menos 8 caracteres',
    test: (password: string) => password.length >= 8,
  },
  {
    label: 'Uma letra maiúscula',
    test: (password: string) => /\p{Lu}/u.test(password),
  },
  {
    label: 'Uma letra minúscula',
    test: (password: string) => /\p{Ll}/u.test(password),
  },
  { label: 'Um número', test: (password: string) => /[0-9]/.test(password) },
]

export const isValidPassword = (password: string) =>
  passwordRequirements.every((requirement) => requirement.test(password))
