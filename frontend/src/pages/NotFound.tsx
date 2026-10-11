import { Compass } from 'lucide-react'
import { ButtonLink } from '../components/Button'

export default function NotFound() {
  return (
    <div className="page-center">
      <section className="card">
        <div className="card-icon">
          <Compass aria-hidden="true" size={26} />
        </div>
        <p className="eyebrow">Error 404</p>
        <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)' }}>
          This stall seems to be empty
        </h1>
        <p>
          We couldn't find the page you were looking for. It may have moved, or
          the address may have been typed incorrectly.
        </p>
        <ButtonLink to="/" variant="primary">
          Return to the homepage
        </ButtonLink>
      </section>
    </div>
  )
}
