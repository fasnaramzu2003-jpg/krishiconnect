
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../services/api.js'
import '../styles/forms.css'

const EMPTY_FORM = { name: '', district: '', area_acres: '', description: '' }

export default function Farms() {
  const { user } = useAuth()
  const summaryRef = useRef(null)
  const [farms, setFarms] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const hasErrors = Object.keys(errors).length > 0 || formError !== ''

  async function loadFarms() {
    try {
      const { data } = await api.get('/farms/')
      setFarms(data.results)
      setLoadError('')
    } catch {
      setLoadError('Could not load your farms. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFarms()
  }, [])

  useEffect(() => {
    if (hasErrors && summaryRef.current) {
      summaryRef.current.focus()
    }
  }, [hasErrors, errors, formError])

  if (user.role !== 'farmer') {
    return (
      <section className="section">
        <h1>My farms</h1>
        <p className="notice">Only farmer accounts can manage farms.</p>
      </section>
    )
  }

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setErrors({})
    setFormError('')
    setMessage('')
    setSaving(true)
    try {
      await api.post('/farms/', form)
      setForm(EMPTY_FORM)
      setMessage('Farm added.')
      await loadFarms()
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object' && !data.detail) {
        setErrors(data)
      } else {
        setFormError(data?.detail || 'Could not save the farm. Please try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  const fieldProps = (name) => ({
    id: name,
    name,
    value: form[name],
    onChange: handleChange,
    'aria-invalid': errors[name] ? 'true' : undefined,
    'aria-describedby': errors[name] ? `${name}-error` : undefined,
  })

  const errorText = (name) =>
    errors[name] ? (
      <p id={`${name}-error`} className="field-error">
        {[].concat(errors[name]).join(' ')}
      </p>
    ) : null

  return (
    <>
      <section className="section" aria-labelledby="farms-title">
        <h1 id="farms-title">My farms</h1>

        {loading && <p role="status">Loading your farms...</p>}
        {loadError && <p role="alert" className="form-error">{loadError}</p>}

        {!loading && !loadError && farms.length === 0 && (
          <p className="section-lead">
            You have no farms yet. Add your first farm using the form below.
          </p>
        )}

        <ul className="feature-grid">
          {farms.map((farm) => (
            <li key={farm.id}>
              <article className="feature-card">
                <h2>{farm.name}</h2>
                <p>{farm.district || 'District not set'}, {farm.state}</p>
                <p>{farm.area_acres} acres · {farm.fields_count} field(s)</p>
              </article>
            </li>
          ))}
        </ul>
      </section>

      <section className="form-page" aria-labelledby="add-farm-title">
        <h2 id="add-farm-title">Add a farm</h2>
        <form onSubmit={handleSubmit} noValidate>
          {message && <p role="status" className="success">{message}</p>}
          {hasErrors && (
            <p role="alert" tabIndex={-1} ref={summaryRef} className="form-error">
              {formError || 'Please fix the problems below.'}
            </p>
          )}

          <div className="field">
            <label htmlFor="name">Farm name</label>
            <input {...fieldProps('name')} type="text" required />
            {errorText('name')}
          </div>

          <div className="field">
            <label htmlFor="district">District</label>
            <input {...fieldProps('district')} type="text" />
            {errorText('district')}
          </div>

          <div className="field">
            <label htmlFor="area_acres">Area in acres</label>
            <input {...fieldProps('area_acres')} type="text" inputMode="decimal" required />
            {errorText('area_acres')}
          </div>

          <div className="field">
            <label htmlFor="description">Description (optional)</label>
            <textarea {...fieldProps('description')} rows={3} />
            {errorText('description')}
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Add farm'}
          </button>
        </form>
      </section>
    </>
  )
}
