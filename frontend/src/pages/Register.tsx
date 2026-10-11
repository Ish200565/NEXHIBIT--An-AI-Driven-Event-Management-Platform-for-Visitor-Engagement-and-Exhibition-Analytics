import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FocusEvent, FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Eye, EyeOff, Info } from 'lucide-react'
import Button, { ButtonLink } from '../components/Button'
import FormField, { fieldAria } from '../components/FormField'
import { formatDateRange } from '../data/events'
import { industries } from '../data/industries'
import { getEvents } from '../services/eventService'
import { registerCompany } from '../services/registrationService'
import type { EventItem, RegistrationRecord } from '../types'
import {
  getPasswordProblem,
  isValidEmail,
  isValidPhone,
  isValidWebsite,
} from '../utils/validation'
import './Events.css'
import './Register.css'

interface FormValues {
  companyName: string
  contactName: string
  email: string
  phone: string
  industry: string
  website: string
  eventId: string
  password: string
  confirmPassword: string
  terms: boolean
}

type FieldName = keyof FormValues
type TextField = Exclude<FieldName, 'terms'>
type Errors = Partial<Record<FieldName, string>>

const emptyValues: FormValues = {
  companyName: '',
  contactName: '',
  email: '',
  phone: '',
  industry: '',
  website: '',
  eventId: '',
  password: '',
  confirmPassword: '',
  terms: false,
}

// The order here is also the order used to find the first error to focus.
const fieldOrder: FieldName[] = [
  'companyName',
  'contactName',
  'email',
  'phone',
  'industry',
  'website',
  'eventId',
  'password',
  'confirmPassword',
  'terms',
]

function validateField(name: FieldName, values: FormValues): string | undefined {
  switch (name) {
    case 'companyName': {
      const text = values.companyName.trim()
      if (text === '') return 'Enter your company name.'
      if (text.length < 2) return 'Company name must be at least 2 characters.'
      return undefined
    }
    case 'contactName': {
      const text = values.contactName.trim()
      if (text === '') return "Enter the contact person's full name."
      if (text.split(/\s+/).length < 2) return 'Enter both first and last name.'
      return undefined
    }
    case 'email': {
      const text = values.email.trim()
      if (text === '') return 'Enter your business email address.'
      if (!isValidEmail(text)) {
        return 'Enter a valid email address, for example name@company.com.'
      }
      return undefined
    }
    case 'phone': {
      const text = values.phone.trim()
      if (text === '') return 'Enter a phone number.'
      if (!isValidPhone(text)) {
        return 'Enter a valid phone number with 7 to 15 digits. You may use +, spaces, brackets and dashes.'
      }
      return undefined
    }
    case 'industry':
      return values.industry === '' ? 'Choose your industry.' : undefined
    case 'website': {
      const text = values.website.trim()
      if (text !== '' && !isValidWebsite(text)) {
        return 'Enter a valid website address, for example www.company.com.'
      }
      return undefined
    }
    case 'password': {
      if (values.password === '') return 'Create a password.'
      return getPasswordProblem(values.password) ?? undefined
    }
    case 'confirmPassword': {
      if (values.confirmPassword === '') return 'Re-enter your password.'
      if (values.confirmPassword !== values.password) {
        return 'The passwords do not match.'
      }
      return undefined
    }
    case 'terms':
      return values.terms ? undefined : 'You must accept the demo terms to continue.'
    default:
      return undefined
  }
}

function validateAll(values: FormValues): Errors {
  const errors: Errors = {}
  for (const name of fieldOrder) {
    const message = validateField(name, values)
    if (message) errors[name] = message
  }
  return errors
}

export default function Register() {
  const [searchParams] = useSearchParams()

  const [values, setValues] = useState<FormValues>(() => ({
    ...emptyValues,
    eventId: searchParams.get('event') ?? '',
  }))
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({})
  const [events, setEvents] = useState<EventItem[]>([])
  const [showPasswords, setShowPasswords] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [record, setRecord] = useState<RegistrationRecord | null>(null)

  // Stops a double click from sending the form twice before React re-renders.
  const submittingRef = useRef(false)
  const successHeadingRef = useRef<HTMLHeadingElement>(null)

  // Load events for the "Event of interest" list. The field is optional,
  // so if loading fails the form still works.
  useEffect(() => {
    let cancelled = false

    getEvents()
      .then((data) => {
        if (!cancelled) setEvents(data)
      })
      .catch(() => {
        // Optional field: continue without the event list.
      })

    return () => {
      cancelled = true
    }
  }, [])

  // Move keyboard and screen-reader focus to the success message.
  useEffect(() => {
    if (record) successHeadingRef.current?.focus()
  }, [record])

  const errors = validateAll(values)
  const shown = (name: FieldName) => (touched[name] ? errors[name] : undefined)

  // Only accept an event id from the address bar if that event really exists.
  const selectedEventId = events.some((event) => event.id === values.eventId)
    ? values.eventId
    : ''

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target
    setValues((previous) => ({ ...previous, [name]: value }))
    if (submitError) setSubmitError('')
  }

  const handleTerms = (e: ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked
    setValues((previous) => ({ ...previous, terms: checked }))
    setTouched((previous) => ({ ...previous, terms: true }))
  }

  const handleBlur = (e: FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name } = e.target
    setTouched((previous) => ({ ...previous, [name]: true }))
  }

  // Props shared by every text input and select.
  const inputProps = (name: TextField, hint?: string) => ({
    id: `reg-${name}`,
    name,
    className: 'input',
    value: values[name],
    onChange: handleChange,
    onBlur: handleBlur,
    ...fieldAria(`reg-${name}`, hint, shown(name)),
  })

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (submittingRef.current) return

    // Show every error, then focus the first invalid field.
    setTouched(
      Object.fromEntries(fieldOrder.map((name) => [name, true])) as Record<
        FieldName,
        boolean
      >,
    )
    const firstInvalid = fieldOrder.find((name) => errors[name])
    if (firstInvalid) {
      document.getElementById(`reg-${firstInvalid}`)?.focus()
      return
    }

    submittingRef.current = true
    setSubmitting(true)
    setSubmitError('')

    try {
      const saved = await registerCompany({
        companyName: values.companyName.trim(),
        contactName: values.contactName.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        industry: values.industry,
        website: values.website.trim(),
        eventId: selectedEventId,
        password: values.password,
      })
      setRecord(saved)
      setValues(emptyValues) // also clears the password from memory
      setTouched({})
      setShowPasswords(false)
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

  // ===== Success screen =====
  if (record) {
    const eventName =
      events.find((event) => event.id === record.eventId)?.name ??
      'No specific event selected'

    return (
      <div className="container register-page">
        <section className="card success-card" aria-labelledby="success-title">
          <div className="success-head">
            <CheckCircle2 aria-hidden="true" size={40} />
            <h2 id="success-title" ref={successHeadingRef} tabIndex={-1}>
              Registration received (demo)
            </h2>
          </div>
          <p>
            Thank you, {record.contactName}. Your company registration has been
            recorded with the status <strong>{record.status}</strong>.
          </p>

          <dl className="summary-list">
            <dt>Reference</dt>
            <dd>{record.id}</dd>
            <dt>Company</dt>
            <dd>{record.companyName}</dd>
            <dt>Email</dt>
            <dd>{record.email}</dd>
            <dt>Industry</dt>
            <dd>{record.industry}</dd>
            <dt>Event of interest</dt>
            <dd>{eventName}</dd>
            <dt>Submitted</dt>
            <dd>
              {new Date(record.submittedAt).toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </dd>
          </dl>

          <div className="notice">
            <Info aria-hidden="true" size={18} />
            <p>
              <strong>Demo only:</strong> these details are saved in this
              browser's local storage, not in a database. No email was sent,
              and your password was not saved.
            </p>
          </div>

          <div className="success-actions">
            <ButtonLink to="/dashboard" variant="primary">
              Go to company dashboard
            </ButtonLink>
            <ButtonLink to="/events" variant="secondary">
              Browse events
            </ButtonLink>
            <Button variant="ghost" onClick={() => setRecord(null)}>
              Register another company
            </Button>
          </div>
        </section>
      </div>
    )
  }

  // ===== Registration form =====
  return (
    <div className="container register-page">
      <header className="page-header">
        <p className="eyebrow">Company registration</p>
        <h1>Register your company</h1>
        <p>
          Create a company profile and tell the organisers which exhibition you
          are interested in. Fields marked with * are required.
        </p>
        <div className="notice">
          <Info aria-hidden="true" size={18} />
          <p>
            <strong>Demo only:</strong> this form saves non-sensitive details in
            your browser's local storage for demonstration. It is not a secure
            or shared database, and your password is never saved.
          </p>
        </div>
      </header>

      <div className="register-layout">
        <form
          className="card form-card"
          onSubmit={handleSubmit}
          noValidate
          aria-label="Company registration form"
        >
          <h2>Company details</h2>

          <div className="form-grid">
            <div className="full">
              <FormField
                id="reg-companyName"
                label="Company name"
                required
                error={shown('companyName')}
              >
                <input
                  {...inputProps('companyName')}
                  type="text"
                  autoComplete="organization"
                  aria-required="true"
                />
              </FormField>
            </div>

            <FormField
              id="reg-contactName"
              label="Contact person's full name"
              required
              error={shown('contactName')}
            >
              <input
                {...inputProps('contactName')}
                type="text"
                autoComplete="name"
                aria-required="true"
              />
            </FormField>

            <FormField
              id="reg-email"
              label="Business email"
              required
              error={shown('email')}
            >
              <input
                {...inputProps('email')}
                type="email"
                autoComplete="email"
                aria-required="true"
              />
            </FormField>

            <FormField
              id="reg-phone"
              label="Phone number"
              required
              error={shown('phone')}
            >
              <input
                {...inputProps('phone')}
                type="tel"
                autoComplete="tel"
                aria-required="true"
              />
            </FormField>

            <FormField
              id="reg-industry"
              label="Industry"
              required
              error={shown('industry')}
            >
              <select {...inputProps('industry')} aria-required="true">
                <option value="">Select an industry</option>
                {industries.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              id="reg-website"
              label="Company website"
              optional
              error={shown('website')}
            >
              <input
                {...inputProps('website')}
                type="text"
                inputMode="url"
                autoComplete="url"
                placeholder="www.company.com"
              />
            </FormField>

            <FormField
              id="reg-eventId"
              label="Event of interest"
              optional
              hint="Pick an exhibition you would like to take part in."
            >
              <select
                {...inputProps(
                  'eventId',
                  'Pick an exhibition you would like to take part in.',
                )}
                value={selectedEventId}
              >
                <option value="">No specific event yet</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name} ({formatDateRange(event.startDate, event.endDate)})
                  </option>
                ))}
              </select>
            </FormField>

            <p className="form-divider full">Account</p>

            <FormField
              id="reg-password"
              label="Password"
              required
              hint="At least 8 characters, with a letter and a number."
              error={shown('password')}
            >
              <input
                {...inputProps(
                  'password',
                  'At least 8 characters, with a letter and a number.',
                )}
                type={showPasswords ? 'text' : 'password'}
                autoComplete="new-password"
                aria-required="true"
              />
            </FormField>

            <FormField
              id="reg-confirmPassword"
              label="Confirm password"
              required
              error={shown('confirmPassword')}
            >
              <input
                {...inputProps('confirmPassword')}
                type={showPasswords ? 'text' : 'password'}
                autoComplete="new-password"
                aria-required="true"
              />
            </FormField>

            <div className="full">
              <button
                type="button"
                className="link-button"
                aria-pressed={showPasswords}
                onClick={() => setShowPasswords((value) => !value)}
              >
                {showPasswords ? (
                  <EyeOff aria-hidden="true" size={18} />
                ) : (
                  <Eye aria-hidden="true" size={18} />
                )}
                {showPasswords ? 'Hide passwords' : 'Show passwords'}
              </button>
            </div>

            <div className="full">
              <div className="field">
                <label className="check" htmlFor="reg-terms">
                  <input
                    id="reg-terms"
                    name="terms"
                    type="checkbox"
                    checked={values.terms}
                    onChange={handleTerms}
                    onBlur={handleBlur}
                    aria-required="true"
                    {...fieldAria('reg-terms', undefined, shown('terms'))}
                  />
                  <span>
                    I understand this is a student demo project: the sample
                    details I enter are kept only in this browser, and nothing
                    is sent to the organisers.
                  </span>
                </label>
                {shown('terms') && (
                  <p id="reg-terms-error" className="field-error">
                    {shown('terms')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {submitError && (
            <div className="form-alert" role="alert">
              <AlertTriangle aria-hidden="true" size={20} />
              <span>{submitError}</span>
            </div>
          )}

          <div className="form-actions">
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit registration'}
            </Button>
            <p role="status" aria-live="polite">
              {submitting ? 'Saving your demo registration…' : ''}
            </p>
          </div>
        </form>

        <aside className="card side-info" aria-label="About registration">
          <div>
            <h2>What happens next</h2>
            <p>The planned flow once the full system is connected:</p>
            <ol className="side-steps">
              <li>Your company profile is created.</li>
              <li>The organiser reviews your application.</li>
              <li>If approved, a stall is allocated to you.</li>
              <li>Your dashboard shows visitor engagement for your stall.</li>
            </ol>
          </div>
          <div className="notice">
            <Info aria-hidden="true" size={18} />
            <p>
              In this demo no review happens and no email is sent. Dashboard
              data is sample data.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}