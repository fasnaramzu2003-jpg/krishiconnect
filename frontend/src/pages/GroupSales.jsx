
import { useEffect, useState } from 'react'
import GroupRequestCard from '../components/GroupRequestCard.jsx'
import GroupRequestForm from '../components/GroupRequestForm.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../services/api.js'
import '../styles/forms.css'

export default function GroupSales() {
  const { user } = useAuth()
  const [tab, setTab] = useState('open')
  const [version, setVersion] = useState(0)
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')

  const tabs = [['open', 'Open requests']]
  if (user.role === 'farmer') tabs.push(['pledges', 'My pledges'])
  if (user.role === 'buyer') tabs.push(['mine', 'My requests'])

  useEffect(() => {
    let active = true
    const params = {}
    if (tab === 'pledges') params.contributed = 'true'
    if (tab === 'mine') params.mine = 'true'
    api
      .get('/group-requests/', { params })
      .then(({ data }) => {
        if (!active) return
        setRequests(data.results)
        setLoadError('')
      })
      .catch(() => {
        if (active) setLoadError('Could not load requests. Is the backend running?')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [tab, version])

  function reload() {
    setVersion((v) => v + 1)
  }

  async function handleAction(request, action, body) {
    setBusy(true)
    setMessage('')
    setErrors({ ...errors, [request.id]: '' })
    try {
      await api.post(`/group-requests/${request.id}/${action}/`, body || {})
      setMessage('Done.')
      reload()
    } catch (err) {
      const data = err.response?.data || {}
      const problem = data.quantity || data.detail || data.non_field_errors
      setErrors({
        ...errors,
        [request.id]:
          (Array.isArray(problem) ? problem.join(' ') : problem) ||
          'Could not complete that action.',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <section className="section" aria-labelledby="gs-title">
        <h1 id="gs-title">Group selling</h1>
        <p className="section-lead">
          Buyers post bulk needs. Farmers pledge parts of it together.
        </p>

        <div className="filter-buttons" role="group" aria-label="Show">
          {tabs.map(([key, label]) => (
            <button key={key} type="button" className="btn btn-secondary"
              aria-pressed={tab === key} onClick={() => setTab(key)}>
              {label}
            </button>
          ))}
        </div>

        {loading && <p role="status">Loading...</p>}
        {loadError && <p role="alert" className="form-error">{loadError}</p>}
        {message && <p role="status" className="success">{message}</p>}
        {!loading && !loadError && requests.length === 0 && (
          <p className="section-lead">Nothing here yet.</p>
        )}

        <ul className="feature-grid">
          {requests.map((request) => (
            <li key={request.id}>
              <GroupRequestCard request={request} user={user} busy={busy}
                error={errors[request.id]} onAction={handleAction} />
            </li>
          ))}
        </ul>
      </section>

      {user.role === 'buyer' && (
        <section className="section">
          <GroupRequestForm onCreated={reload} />
        </section>
      )}
    </>
  )
}
