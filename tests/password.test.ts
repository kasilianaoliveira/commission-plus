import { expect, test } from 'vitest'
import { isValidPassword } from '../src/utils/password.ts'

test('requires eight characters, both letter cases and a digit for a new password', () => {
  expect(isValidPassword('Abcdefg')).toBe(false)
  expect(isValidPassword('abcdefgh')).toBe(false)
  expect(isValidPassword('ABCDEFGH')).toBe(false)
  expect(isValidPassword('Abcdefgh')).toBe(false)
  expect(isValidPassword('Árvore12')).toBe(true)
  expect(isValidPassword('aB123456')).toBe(true)
})
