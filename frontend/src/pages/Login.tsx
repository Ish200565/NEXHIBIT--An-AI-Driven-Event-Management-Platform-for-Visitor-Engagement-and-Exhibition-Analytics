import { useRef, useState } from 'react'
import type { ChangeEvent, FocusEvent, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, Eye, EyeOff, Info, LogOut } from 'lucide-react'
import Button, { ButtonLink } from '../components/Button'
import FormField, { fieldAria } from '../components/FormField'
import { useSession } from '../hooks/useSession'
import {
  DEMO_PASSWORD,
  demoAccounts,
  login,
  logout,
} from '../services/authService'
import type { DemoAccount } from '../services/authService'
import { isValidEmail } from '../utils/validation'
import './Events.css'
import './Register.css'
import './Login.css'

interface LoginValues {
  email: string
  password: string
}

type LoginField = keyof LoginValues

function validateField(
  name: LoginField,
  values: LoginValues,
): string | undefined {
  if (name === 'email') {
    const text = values.email.trim()
    if (text === '') return 'Enter your email address.'
    if (!isValidEmail(text)) {
      return 'Enter a valid email address, for example name@company.com.'
    }
    return undefined
  }
  return values.password === '' ? 'Enter your password.' : undefined
}

export default function Login() {
  const navigate = useNavigate()
  const session = useSession()

  const [values, setValues] = useState<LoginValues>({ email: '', password: '' })
  const [touched, setTouched] = useState<Partial<Record<LoginField, boolean>>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Stops a double click from sending the form twice.
  const submittingRef = useRef(false)

  const errors: Partial<Record<LoginField, string>> = {
    email: validateField('email', values),
    password: validateField('password', values),
  }
  const shown = (name: LoginField) => (touched[name] ? errors[name] : undefined)

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setValues((previous) => ({ ...previous, [name]: value }))
    if (submitError) setSubmitError('')
  }

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    const { name } = e.target
    setTouched((previous) => ({ ...previous, [name]: true }))
  }

  const fillDemo = (account: DemoAccount) => {
    setValues({ email: account.email, password: DEMO_PASSWORD })
    setTouched({})
    setSubmitError('')
    document.getElementById('login-email')?.focus()
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (submittingRef.current) return

    setTouched({ email: true, password: true })
    if (errors.email) {
      document.getElementById('login-email')?.focus()
      return
    }
    if (errors.password) {
      document.getElementById('login-password')?.focus()
      return
    }

    submittingRef.current = true
    setSubmitting(true)
    setSubmitError('')

    try {
      const signedIn = await login(values.email.trim(), values.password)
      setValues({ email: '', password: '' }) // clears the password from memory
      navigate(signedIn.role === 'organizer' ? '/organizer' : '/dashboard')
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Something went wrong. Please try again.',
      )
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  // ===== Already signed in =====
  if (session) {
    const home = session.role === 'organizer' ? '/organizer' : '/dashboard'

    return (
      <div className="container register-page">
        <section
          className="card signed-in-card"
          aria-labelledby="signed-in-title"
          style={{ marginTop: '3rem' }}
        >
          <span className="demo-badge">Demo session</span>
          <h2 id="signed-in-title">You are signed in</h2>
          <p>
            Signed in as <strong>{session.name}</strong> ({session.email}).
            This is a demo session kept only in this browser tab.
          </p>
          <div className="signed-in-actions">
            <ButtonLink to={home} variant="primary">
              Go to my dashboard
            </ButtonLink>
            <Button variant="ghost" onClick={logout}>
              <LogOut aria-hidden="true" size={18} /> Sign out
            </Button>
          </div>
        </section>
      </div>
    )
  }

  // ===== Sign-in form =====
  return (
    <div className="container register-page">
      <header className="page-header">
        <p className="eyebrow">Sign in</p>
        <h1>Welcome back</h1>
        <p>Sign in to see your company or organiser dashboard.</p>
        <div className="notice">
          <Info aria-hidden="true" size={18} />
          <p>
            <strong>Demo mode:</strong> there is no real account system yet.
            Only the two demo accounts on this page can sign in. Please do not
            enter a real password.
          </p>
        </div>
      </header>

      <div className="login-layout">
        <form
          className="card"
          onSubmit={handleSubmit}
          noValidate
          aria-label="Sign in form"
        >
          <span className="demo-badge">Demo mode</span>
          <h2>Sign in</h2>

          <div className="login-form">
            <FormField
              id="login-email"
              label="Email"
              required
              error={shown('email')}
            >
              <input
                id="login-email"
                name="email"
                type="email"
                className="input"
                autoComplete="username"
                aria-required="true"
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
                {...fieldAria('login-email', undefined, shown('email'))}
              />
            </FormField>

            <FormField
              id="login-password"
              label="Password"
              required
              error={shown('password')}
            >
              <input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                className="input"
                autoComplete="current-password"
                aria-required="true"
                value={values.password}
                onChange={handleChange}
                onBlur={handleBlur}
                {...fieldAria('login-password', undefined, shown('password'))}
              />
            </FormField>

            <div>
              <button
                type="button"
                className="link-button"
                aria-pressed={showPassword}
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? (
                  <EyeOff aria-hidden="true" size={18} />
                ) : (
                  <Eye aria-hidden="true" size={18} />
                )}
                {showPassword ? 'Hide password' : 'Show password'}
              </button>
            </div>

            {submitError && (
              <div className="form-alert" role="alert" style={{ marginTop: 0 }}>
                <AlertTriangle aria-hidden="true" size={20} />
                <span>{submitError}</span>
              </div>
            )}

            <div className="form-actions" style={{ marginTop: 0 }}>
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? 'Signing in…' : 'Sign in'}
              </Button>
              <p role="status" aria-live="polite">
                {submitting ? 'Checking the demo account…' : ''}
              </p>
            </div>

            <p className="login-foot">
              New company? <Link to="/register">Register your company</Link>.
              Password reset is not available in the demo.
            </p>
          </div>
        </form>

        <aside className="card demo-panel" aria-labelledby="demo-title">
          <div>
            <span className="demo-badge">Demo accounts</span>
            <h2 id="demo-title">Try the demo</h2>
            <p>
              These accounts are fictional. Choose one to fill in the form,
              then press <strong>Sign in</strong>.
            </p>
          </div>

          {demoAccounts.map((account) => (
            <div key={account.email} className="demo-account">
              <h3>{account.name}</h3>
              <p>{account.description}</p>
              <dl className="cred">
                <dt>Email</dt>
                <dd>
                  <code>{account.email}</code>
                </dd>
                <dt>Password</dt>
                <dd>
                  <code>{DEMO_PASSWORD}</code>
                </dd>
              </dl>
              <Button variant="secondary" onClick={() => fillDemo(account)}>
                Fill in this account
              </Button>
            </div>
          ))}

          <div className="notice">
            <Info aria-hidden="true" size={18} />
            <p>
              Your sign-in is remembered only for this browser tab and is
              forgotten when you close it. Dashboard data is sample data.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
