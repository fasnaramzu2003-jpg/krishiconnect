
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api.js'
import '../styles/forms.css'

function announce() {
  window.dispatchEvent(new Event('notifications-changed'))
}

export default function Notifications() {
  const [items, setItems] = useState([])
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let active = true
    const params = unreadOnly ? { unread: 'true' } : {}
    api
      .get('/notifications/', { params })
      .then(({ data }) => {
        if (!active) return
        setItems(data.results)
        setError('')
      })
      .catch(() => {
        if (active) setError('Could not load notifications.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [unreadOnly, version])

  async function markRead(id) {
    try {
      await api.post(`/notifications/${id}/read/`)
      announce()
      setVersion((v) => v + 1)
    } catch {
      setError('Could not update the notification.')
    }
  }

  async function markAll() {
    try {
      await api.post('/notifications/read-all/')
      announce()
      setVersion((v) => v + 1)
    } catch {
      setError('Could not update the notifications.')
    }
  }

  return (
    <section className="section" aria-labelledby="notif-title">
      <h1 id="notif-title">Notifications</h1>
      <div className="filter-buttons">
        <button type="button" className="btn btn-secondary" aria-pressed={unreadOnly}
          onClick={() => setUnreadOnly(!unreadOnly)}>
          Only unread
        </button>
        <button type="button" className="btn btn-secondary" onClick={markAll}>
          Mark all as read
        </button>
      </div>

      {loading && <p role="status">Loading...</p>}
      {error && <p role="alert" className="form-error">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <p className="section-lead">Nothing here yet.</p>
      )}

      <ul className="feature-grid">
        {items.map((n) => (
          <li key={n.id}>
            <article className="feature-card">
              {!n.is_read && <span className="badge">New</span>}
              <h3>{n.title}</h3>
              <p>{n.message}</p>
              <p>{new Date(n.created_at).toLocaleString()}</p>
              {n.link && (
                <Link to={n.link} onClick={() => !n.is_read && markRead(n.id)}>
                  Open
                </Link>
              )}
              {!n.is_read && (
                <button type="button" className="btn btn-secondary"
                  aria-label={`Mark "${n.title}" as read`} onClick={() => markRead(n.id)}>
                  Mark as read
                </button>
              )}
            </article>
          </li>
        ))}
      </ul>
    </section>
  )
}
