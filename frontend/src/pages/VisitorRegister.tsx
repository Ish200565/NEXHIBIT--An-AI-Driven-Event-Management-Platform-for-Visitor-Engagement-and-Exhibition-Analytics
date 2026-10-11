import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FocusEvent, FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { QRCodeCanvas } from 'qrcode.react'
import { AlertTriangle, CheckCircle2, Download, Info } from 'lucide-react'
import Button, { ButtonLink } from '../components/Button'
import FormField, { fieldAria } from '../components/FormField'
import { formatDateRange } from '../data/events'
import { getEvents } from '../services/eventService'
import { registerVisitor } from '../services/visitorService'
import type { EventItem } from '../types'
import type { VisitorRecord } from '../types/visitor'
import { isValidEmail, isValidPhone } from '../utils/validation'
import './Events.css'
import './Register.css'
import './VisitorRegister.css'

const visitorTypes = [
  'General visitor',
  'Student',
  'Business buyer',
  'Industry professional',
]

interface FormValues {
  fullName: string
  email: string
  phone: string
  eventId: string
  visitorType: string
  terms: boolean
}

type FieldName = keyof FormValues
type TextField = Exclude<FieldName, 'terms'>
type Errors = Partial<Record<FieldName, string>>

const fieldOrder: FieldName[] = [
  'fullName',
  'email',
  'phone',
  'eventId',
  'visitorType',
  'terms',
]

function validateAll(values: FormValues): Errors {
  const errors: Errors = {}

  const name = values.fullName.trim()
  if (name === '') errors.fullName = 'Enter your full name.'
  else if (name.split(/\s+/).length < 2) {
    errors.fullName = 'Enter both first and last name.'
  }

  const email = values.email.trim()
  if (email === '') errors.email = 'Enter your email address.'
  else if (!isValidEmail(email)) {
    errors.email = 'Enter a valid email address, for example name@example.com.'
  }

  const phone = values.phone.trim()
  if (phone === '') errors.phone = 'Enter a phone number.'
  else if (!isValidPhone(phone)) {
    errors.phone = 'Enter a valid phone number with 7 to 15 digits.'
  }

  if (values.eventId === '') errors.eventId = 'Choose the event you will attend.'
  if (values.visitorType === '') errors.visitorType = 'Choose a visitor type.'
  if (!values.terms) errors.terms = 'You must accept the demo notice to continue.'

  return errors
}

export default function VisitorRegister() {
  const [searchParams] = useSearchParams()

  const [values, setValues] = useState<FormValues>(() => ({
    fullName: '',
    email: '',
    phone: '',
    eventId: searchParams.get('event') ?? '',
    visitorType: '',
    terms: false,
  }))
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({})
  const [events, setEvents] = useState<EventItem[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [record, setRecord] = useState<VisitorRecord | null>(null)

  const submittingRef = useRef(false)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let cancelled = false

    getEvents()
      .then((data) => {
        if (!cancelled) setEvents(data)
      })
      .catch(() => {
        if (!cancelled) setSubmitError('We could not load the event list. Please refresh the page.')
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (record) headingRef.current?.focus()
  }, [record])

  // Only accept an event id from the address bar if that event really exists.
  const selectedEventId = events.some((event) => event.id === values.eventId)
    ? values.eventId
    : ''

  const errors = validateAll({ ...values, eventId: selectedEventId })
  const shown = (name: FieldName) => (touched[name] ? errors[name] : undefined)

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

  const inputProps = (name: TextField) => ({
    id: `vis-${name}`,
    name,
    className: 'input',
    value: name === 'eventId' ? selectedEventId : values[name],
    onChange: handleChange,
    onBlur: handleBlur,
    ...fieldAria(`vis-${name}`, undefined, shown(name)),
  })

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (submittingRef.current) return

    setTouched(
      Object.fromEntries(fieldOrder.map((name) => [name, true])) as Record<
        FieldName,
        boolean
      >,
    )
    const firstInvalid = fieldOrder.find((name) => errors[name])
    if (firstInvalid) {
      document.getElementById(`vis-${firstInvalid}`)?.focus()
      return
    }

    submittingRef.current = true
    setSubmitting(true)
    setSubmitError('')

    try {
      const saved = await registerVisitor({
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        eventId: selectedEventId,
        visitorType: values.visitorType,
      })
      setRecord(saved)
      setValues({
        fullName: '',
        email: '',
        phone: '',
        eventId: '',
        visitorType: '',
        terms: false,
      })
      setTouched({})
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

  const downloadQr = () => {
    const canvas = canvasRef.current
    if (!canvas || !record) return
    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = `nexhibit-pass-${record.id}.png`
    link.click()
  }

  // ===== Success screen with QR code =====
  if (record) {
    const event = events.find((item) => item.id === record.eventId)

    return (
      <div className="container register-page">
        <section className="card success-card" aria-labelledby="pass-title">
          <div className="success-head">
            <CheckCircle2 aria-hidden="true" size={40} />
            <h2 id="pass-title" ref={headingRef} tabIndex={-1}>
              Your visitor pass (demo)
            </h2>
          </div>
          <p>
            Thank you, {record.fullName}. Show this QR code at the entrance
            for check-in.
          </p>

          <div className="pass-layout">
            <div className="qr-box">
              <QRCodeCanvas
                ref={canvasRef}
                value={record.id}
                size={220}
                level="M"
                bgColor="#ffffff"
                fgColor="#0b1220"
                title={`QR code for registration ID ${record.id}`}
              />
            </div>
            <div>
              <p className="pass-id">{record.id}</p>
              <p style={{ margin: 0 }}>Registration ID</p>
              <dl className="summary-list">
                <dt>Event</dt>
                <dd>
                  {event
                    ? `${event.name} (${formatDateRange(event.startDate, event.endDate)})`
                    : 'Unknown event'}
                </dd>
                <dt>Visitor type</dt>
                <dd>{record.visitorType}</dd>
                <dt>Email</dt>
                <dd>{record.email}</dd>
              </dl>
            </div>
          </div>

          <div className="notice">
            <Info aria-hidden="true" size={18} />
            <p>
              <strong>Demo only:</strong> this pass is saved in this browser,
              not in a database, and no email was sent. The QR code contains
              only the Registration ID. Real check-in scanning will be
              connected to the backend later.
            </p>
          </div>

          <div className="success-actions">
            <Button variant="primary" onClick={downloadQr}>
              <Download aria-hidden="true" size={18} /> Download QR code
            </Button>
            <ButtonLink to="/events" variant="secondary">
              Browse events
            </ButtonLink>
            <Button variant="ghost" onClick={() => setRecord(null)}>
              Register another visitor
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
        <p className="eyebrow">Visitor registration</p>
        <h1>Register to visit</h1>
        <p>
          Register in advance and get a QR code for a faster entry. Fields
          marked with * are required.
        </p>
        <div className="notice">
          <Info aria-hidden="true" size={18} />
          <p>
            <strong>Demo only:</strong> your details are saved in this
            browser's local storage, not in a database. Please use sample
            details.
          </p>
        </div>
      </header>

      <form
        className="card form-card"
        onSubmit={handleSubmit}
        noValidate
        aria-label="Visitor registration form"
        style={{ maxWidth: 760 }}
      >
        <h2>Your details</h2>

        <div className="form-grid">
          <div className="full">
            <FormField id="vis-fullName" label="Full name" required error={shown('fullName')}>
              <input
                {...inputProps('fullName')}
                type="text"
                autoComplete="name"
                aria-required="true"
              />
            </FormField>
          </div>

          <FormField id="vis-email" label="Email" required error={shown('email')}>
            <input
              {...inputProps('email')}
              type="email"
              autoComplete="email"
              aria-required="true"
            />
          </FormField>

          <FormField id="vis-phone" label="Phone number" required error={shown('phone')}>
            <input
              {...inputProps('phone')}
              type="tel"
              autoComplete="tel"
              aria-required="true"
            />
          </FormField>

          <FormField id="vis-eventId" label="Event you will attend" required error={shown('eventId')}>
            <select {...inputProps('eventId')} aria-required="true">
              <option value="">Select an event</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name} ({formatDateRange(event.startDate, event.endDate)})
                </option>
              ))}
            </select>
          </FormField>

          <FormField id="vis-visitorType" label="Visitor type" required error={shown('visitorType')}>
            <select {...inputProps('visitorType')} aria-required="true">
              <option value="">Select a type</option>
              {visitorTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </FormField>

          <div className="full">
            <div className="field">
              <label className="check" htmlFor="vis-terms">
                <input
                  id="vis-terms"
                  name="terms"
                  type="checkbox"
                  checked={values.terms}
                  onChange={handleTerms}
                  onBlur={handleBlur}
                  aria-required="true"
                  {...fieldAria('vis-terms', undefined, shown('terms'))}
                />
                <span>
                  I understand this is a student demo project and my details
                  are kept only in this browser.
                </span>
              </label>
              {shown('terms') && (
                <p id="vis-terms-error" className="field-error">
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
            {submitting ? 'Generating your pass…' : 'Get my QR code'}
          </Button>
          <p role="status" aria-live="polite">
            {submitting ? 'Saving your demo registration…' : ''}
          </p>
        </div>
      </form>
    </div>
  )
}