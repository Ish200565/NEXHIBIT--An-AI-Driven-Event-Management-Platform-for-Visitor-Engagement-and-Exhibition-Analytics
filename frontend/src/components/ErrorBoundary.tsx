import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { TriangleAlert } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('NEXHIBIT UI error:', error, info.componentStack)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="page-center" role="alert">
        <section className="card">
          <div className="card-icon">
            <TriangleAlert aria-hidden="true" size={26} />
          </div>
          <p className="eyebrow">Something went wrong</p>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)' }}>
            This page failed to load
          </h1>
          <p>
            An unexpected error happened. Reloading usually fixes it. If it
            keeps happening, return to the homepage.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Reload the page
          </button>{' '}
          <a href="/" className="btn btn-ghost">
            Go to homepage
          </a>
        </section>
      </div>
    )
  }
}