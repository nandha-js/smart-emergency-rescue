export default function StatsBar({ alerts = [] }) {
  const total = alerts.length
  const active = alerts.filter((a) => a.status === 'active').length
  const responding = alerts.filter((a) => a.status === 'responding').length
  const resolved = alerts.filter((a) => a.status === 'resolved').length

  return (
    <div className="stats-bar">
      <div className="stat-card glass-card">
        <div className="stat-number">{total}</div>
        <div className="stat-label">Total Signals</div>
      </div>
      <div className="stat-card active glass-card">
        <div className="stat-number">{active}</div>
        <div className="stat-label">Active SOS</div>
      </div>
      <div className="stat-card responding glass-card">
        <div className="stat-number">{responding}</div>
        <div className="stat-label">Responding</div>
      </div>
      <div className="stat-card resolved glass-card">
        <div className="stat-number">{resolved}</div>
        <div className="stat-label">Resolved</div>
      </div>
    </div>
  )
}
