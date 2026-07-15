import { Link, useLocation } from 'react-router-dom'

export default function Navbar() {
  const location = useLocation()

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <svg
          className="navbar-logo"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
        <div>
          <span className="navbar-title">SERS</span>
          <span className="navbar-subtitle">Smart Emergency Rescue</span>
        </div>
      </div>
      <div className="navbar-links">
        <Link
          to="/"
          className={`navbar-link ${location.pathname === '/' ? 'active' : ''}`}
        >
          SOS Button
        </Link>
        <Link
          to="/dashboard"
          className={`navbar-link ${
            location.pathname === '/dashboard' ? 'active' : ''
          }`}
        >
          Dashboard
          <span className="live-dot" />
        </Link>
      </div>
    </nav>
  )
}
