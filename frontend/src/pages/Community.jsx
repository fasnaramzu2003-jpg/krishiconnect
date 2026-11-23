
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import FormField from '../components/FormField.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../services/api.js'
import { parseApiError } from '../utils/apiErrors.js'
import '../styles/forms.css'

function text(value) {
  return Array.isArray(value) ? value.join(' ') : value || ''
}

function AskForm({ onCreated }) {
  const summaryRef = useRef(null)
  const [crops, setCrops] = useState([])
  const [form, setForm] = useState({ title: '', body: '', crop: '', district: '' })
  const [errors, setErrors] = useState({})
  const [general, setGeneral] = useState('')
  const [saving, setSaving] = useState(false)
  const hasErrors = Object.keys(errors).length > 0 || general !== ''

  useEffect(() => {
    api
      .get('/crops/')
      .then(({ data }) => setCrops(Array.isArray(data) ? data : data.results))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (hasErrors && summaryRef.current) summaryRef.current.focus()
  }, [hasErrors, errors, general])

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setErrors({})
    setGeneral('')
    setSaving(true)
    const payload = { ...form, crop: form.crop || null }
    try {
      await api.post('/community/questions/', payload)
      setForm({ title: '', body: '', crop: '', district: '' })
      onCreated()
    } catch (err) {
      const parsed = parseApiError(err)
      setErrors(parsed.fields)
      setGeneral(parsed.general)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="order-box" aria-labelledby="ask-title">
      <h2 id="ask-title">Ask a question</h2>
      <form onSubmit={handleSubmit} noValidate>
        {hasErrors && (
          <p role="alert" tabIndex={-1} ref={summaryRef} className="form-error">
            {general || 'Please fix the problems below.'}
          </p>
        )}
        <FormField label="Question title" name="title" value={form.title}
          onChange={handleChange} error={text(errors.title)} required />
        <FormField as="textarea" label="Details" name="body" rows={4} value={form.body}
          onChange={handleChange} error={text(errors.body)} required />
        <div className="form-field select-field">
          <label htmlFor="ask-crop">Crop (optional)</label>
          <select id="ask-crop" name="crop" value={form.crop} onChange={handleChange}>
            <option value="">Not about one crop</option>
            {crops.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <FormField label="District (optional)" name="district" value={form.district}
          onChange={handleChange} error={text(errors.district)} />
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Posting...' : 'Post question'}
        </button>
      </form>
    </section>
  )
}

export default function Community() {
  const { user } = useAuth()
  const [questions, setQuestions] = useState([])
  const [search, setSearch] = useState('')
  const [applied, setApplied] = useState('')
  const [unanswered, setUnanswered] = useState(false)
  const [version, setVersion] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const params = {}
    if (applied) params.q = applied
    if (unanswered) params.unanswered = 'true'
    api
      .get('/community/questions/', { params })
      .then(({ data }) => {
        if (!active) return
        setQuestions(data.results)
        setError('')
      })
      .catch(() => {
        if (active) setError('Could not load questions. Is the backend running?')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [applied, unanswered, version])

  function handleSearch(event) {
    event.preventDefault()
    setApplied(search.trim())
  }

  return (
    <>
      <section className="section" aria-labelledby="community-title">
        <h1 id="community-title">Community questions</h1>
        <p className="section-lead">
          Ask and answer farming questions. A "Verified expert" badge means an admin
          checked that person. Advice here is not a substitute for Krishi Bhavan.
        </p>

        <form onSubmit={handleSearch} role="search">
          <label htmlFor="community-search">Search questions</label>
          <input id="community-search" type="search" value={search}
            onChange={(e) => setSearch(e.target.value)} />
          <button type="submit" className="btn btn-secondary">Search</button>
        </form>
        <p>
          <button type="button" className="btn btn-secondary" aria-pressed={unanswered}
            onClick={() => setUnanswered(!unanswered)}>
            Only unanswered
          </button>
        </p>

        {loading && <p role="status">Loading...</p>}
        {error && <p role="alert" className="form-error">{error}</p>}
        {!loading && !error && questions.length === 0 && (
          <p className="section-lead">No questions found.</p>
        )}
        <ul className="feature-grid">
          {questions.map((q) => (
            <li key={q.id}>
              <article className="feature-card">
                {q.has_accepted && <span className="badge">Answered</span>}
                <h3><Link to={`/community/${q.id}`}>{q.title}</Link></h3>
                <p>
                  {q.crop_name ? `${q.crop_name} · ` : ''}
                  {q.district ? `${q.district} · ` : ''}
                  asked by {q.author_name}
                </p>
                <p>{q.answers_count} answer(s)</p>
              </article>
            </li>
          ))}
        </ul>
      </section>

      <section className="section">
        {user ? (
          <AskForm onCreated={() => setVersion((v) => v + 1)} />
        ) : (
          <p className="notice">
            <Link to="/login">Log in</Link> or <Link to="/register">register</Link> to
            ask or answer.
          </p>
        )}
      </section>
    </>
  )
}
