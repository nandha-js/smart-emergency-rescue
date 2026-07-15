export default function PatientCard({ patient }) {
  if (!patient) return null

  // Initials for avatar
  const initials = patient.name
    ? patient.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : '??'

  return (
    <div className="patient-card glass-card">
      <div className="patient-header">
        <div
          className="patient-avatar"
          style={{
            background: 'linear-gradient(135deg, var(--color-danger), #ff8484)',
            color: 'white',
          }}
        >
          {initials}
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text)' }}>
            {patient.name}
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
            Age: {patient.age || 'N/A'} | {patient.phone}
          </span>
        </div>
        <div className="patient-blood-type">{patient.bloodType || 'N/A'}</div>
      </div>

      <div className="patient-section">
        <h4>Allergies</h4>
        {patient.allergies && patient.allergies.length > 0 ? (
          <div>
            {patient.allergies.map((allergy, index) => (
              <span key={index} className="patient-pill allergy">
                {allergy}
              </span>
            ))}
          </div>
        ) : (
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
            No known drug or food allergies.
          </span>
        )}
      </div>

      <div className="patient-section">
        <h4>Pre-existing Conditions</h4>
        {patient.conditions && patient.conditions.length > 0 ? (
          <div>
            {patient.conditions.map((condition, index) => (
              <span key={index} className="patient-pill condition">
                {condition}
              </span>
            ))}
          </div>
        ) : (
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
            No registered clinical history.
          </span>
        )}
      </div>

      <div className="patient-section">
        <h4>Current Medications</h4>
        {patient.medications && patient.medications.length > 0 ? (
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
            {patient.medications.join(', ')}
          </div>
        ) : (
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
            None registered.
          </span>
        )}
      </div>

      <div className="patient-section">
        <h4>Emergency Contact</h4>
        {patient.emergencyContact ? (
          <div className="patient-contact">
            <div>
              <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                {patient.emergencyContact.name}
              </span>
              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-text-secondary)',
                  marginLeft: '0.5rem',
                }}
              >
                ({patient.emergencyContact.relationship})
              </span>
            </div>
            <a
              href={`tel:${patient.emergencyContact.phone}`}
              style={{
                color: 'var(--color-info)',
                fontSize: '0.85rem',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              {patient.emergencyContact.phone}
            </a>
          </div>
        ) : (
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
            No primary contact designated.
          </span>
        )}
      </div>
    </div>
  )
}
