import { Construction } from 'lucide-react'
import { ButtonLink } from '../components/Button'

interface PagePlaceholderProps {
  title: string
  batch: number
  description: string
}

// Temporary page used until the real page is built in its batch.
export default function PagePlaceholder({
  title,
  batch,
  description,
}: PagePlaceholderProps) {
  return (
    <div className="page-center">
      <section className="card">
        <div className="card-icon">
          <Construction aria-hidden="true" size={26} />
        </div>
        <p className="eyebrow">Coming in Batch {batch}</p>
        <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)' }}>{title}</h1>
        <p>{description}</p>
        <ButtonLink to="/" variant="secondary">
          Back to Home
        </ButtonLink>
      </section>
    </div>
  )
}
