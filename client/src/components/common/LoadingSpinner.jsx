export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="empty-state">
      <div className="spinner" style={{ margin: '0 auto 1.5rem' }}></div>
      <p style={{ color: 'var(--color-text-secondary)' }}>{message}</p>
    </div>
  )
}
