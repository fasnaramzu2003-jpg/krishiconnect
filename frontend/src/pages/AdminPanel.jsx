
import { useEffect, useState } from 'react'
import api from '../services/api.js'
import '../styles/forms.css'

function Counts({ title, data }) {
  const entries = Object.entries(data || {})
  return (
    <section className="feature-card">
      <h3>{title}</h3>
      {entries.length === 0 ? (
        <p>None yet.</p>
      ) : (
        <ul>
          {entries.map(([key, value]) => (
            <li key={key}>{key}: {value}</li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default function AdminPanel() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get('/admin-stats/')
      .then(({ data }) => setStats(data))
      .catch((err) =>
        setError(
          err.response?.status === 403
            ? 'This page is for admins only.'
            : 'Could not load statistics.',
        ),
      )
  }, [])

  return (
    <section className="section" aria-labelledby="admin-title">
      <h1 id="admin-title">Admin overview</h1>
      {error && <p role="alert" className="form-error">{error}</p>}
      {stats && (
        <>
          <ul className="feature-grid">
            <li><Counts title="Users by role" data={stats.users_by_role} /></li>
            <li><Counts title="Listings" data={stats.listings_by_status} /></li>
            <li><Counts title="Orders" data={stats.orders_by_status} /></li>
            <li><Counts title="Group requests" data={stats.group_requests_by_status} /></li>
            <li>
              <Counts title="Other" data={{
                'Experts waiting for verification': stats.unverified_experts,
                'Community questions': stats.questions,
                'Open reports': stats.open_reports,
                'Crop health checks': stats.health_reports,
                'Market price rows': stats.market_prices,
                'Of which DEMO rows': stats.demo_prices,
              }} />
            </li>
          </ul>
          <p>
            To verify experts, hide content or review reports, use the Django admin at{' '}
            <a href="http://127.0.0.1:8000/admin/">127.0.0.1:8000/admin/</a>.
          </p>
        </>
      )}
    </section>
  )
}
