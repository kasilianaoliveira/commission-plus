import { useState } from 'react'
import { ArrowRight, Check, Mail, ShieldCheck, TrendingUp } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { useAuthAction } from '../../api/auth'
import type { AuthFields, AuthMode } from '../../types/auth'
import { isValidPassword } from '../../utils/password'
import { PasswordField } from '../password-field'
import { Header } from '../header'
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
      <div className={styles.confirmationPage}>
        <Header />
        <main
          className={styles.confirmationMain}
          id="top"
        >
          <div className={styles.confirmationLayout}>
            <section
              className={styles.welcome}
              aria-labelledby="welcome-title"
            >
              <span className={styles.eyebrow}>
                MAIS CLAREZA. MAIS RESULTADOS.
              </span>
              <h2 id="welcome-title">
                Sua equipe merece <span>cada conquista.</span>
              </h2>
              <p>
                Organize suas vendas, acompanhe as comissões e tenha mais tempo
                para o que faz sua equipe crescer.
              </p>
              <div
                className={styles.welcomeIllustration}
                aria-hidden="true"
              >
                <div className={styles.chartHeading}>
                  <span>
                    <TrendingUp size={18} /> Cada venda conta
                  </span>
                  <span className={styles.chartBadge}>
                    <Check size={14} />
                  </span>
                </div>
                <div className={styles.chartBars}>
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
                <div className={styles.chartCaption}>
                  Uma visão clara das suas comissões.
                </div>
              </div>
              <div className={styles.welcomeNote}>
                <ShieldCheck size={19} />
                <span>Sua equipe e suas comissões em um só lugar.</span>
              </div>
            </section>

            <section
              className={styles.confirmationCard}
              aria-labelledby="confirmation-title"
            >
              <div
                className={styles.progress}
                aria-label="Etapa 2 de 3: confirmar e-mail"
              >
                <span className={styles.completedStep}>
                  <Check size={12} /> Cadastro
                </span>
                <span className={styles.progressLine} />
                <span className={styles.currentStep}>
                  02 <span>Confirmação</span>
                </span>
                <span className={styles.progressLine} />
                <span>
                  03 <span>Acesso</span>
                </span>
              </div>
              <div
                className={styles.mailIcon}
                aria-hidden="true"
              >
                <Mail
                  size={34}
                  strokeWidth={1.6}
                />
                <span>
                  <Check
                    size={13}
                    strokeWidth={3}
                  />
                </span>
              </div>
              <span className={styles.eyebrow}>SÓ MAIS UM PASSO</span>
              <h1 id="confirmation-title">Confira seu e-mail</h1>
              <p className={styles.confirmationIntro}>
                Se este endereço ainda não tiver uma conta, você receberá um
                link para confirmar seu cadastro.
              </p>
              <div className={styles.emailAddress}>
                <Mail
                  size={17}
                  aria-hidden="true"
                />
                <strong>{getValues('email').trim()}</strong>
              </div>
              <ol className={styles.nextSteps}>
                <li>
                  <span>1</span>
                  <div>
                    <strong>Abra sua caixa de entrada</strong>
                    <p>
                      Não encontrou? Confira também o spam ou lixo eletrônico.
                    </p>
                  </div>
                </li>
                <li>
                  <span>2</span>
                  <div>
                    <strong>Confirme seu cadastro pelo link</strong>
                    <p>Depois, volte aqui e entre para começar.</p>
                  </div>
                </li>
              </ol>
              <p
                role="status"
                className="sr-only"
              >
                {message}
              </p>
              <button
                className={styles.primaryAction}
                type="button"
                onClick={() => changeMode('login')}
              >
                Ir para o login{' '}
                <ArrowRight
                  size={18}
                  aria-hidden="true"
                />
              </button>
              <button
                className={styles.editEmail}
                type="button"
                onClick={() => changeMode('signup')}
              >
                Usar outro e-mail
              </button>
              <div className={styles.existingAccount}>
                Já tem uma conta? Entre ou{' '}
                <button
                  type="button"
                  onClick={() => changeMode('reset')}
                >
                  recupere sua senha
                </button>
                .
              </div>
            </section>
          </div>
        </main>
        <footer className={styles.confirmationFooter}>
          Comissão+ <span>·</span> Mais organização para sua equipe. Mais
          tranquilidade para você.
        </footer>
      </div>
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
