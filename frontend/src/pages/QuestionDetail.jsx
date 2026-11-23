
import { useEffect, useId, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../services/api.js'
import '../styles/forms.css'

function problemText(err) {
  const d = err.response?.data || {}
  const found = d.detail || d.reason || d.body || d.answer
  return (Array.isArray(found) ? found.join(' ') : found) || 'Something went wrong.'
}

function ReportButton({ url, label }) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [message, setMessage] = useState('')

  async function submit(event) {
    event.preventDefault()
    try {
      const { data } = await api.post(url, { reason })
      setMessage(data.detail)
      setOpen(false)
      setReason('')
    } catch (err) {
      setMessage(problemText(err))
    }
  }

  return (
    <div>
      {!open && (
        <button type="button" className="btn btn-secondary" aria-label={label}
          onClick={() => setOpen(true)}>
          Report
        </button>
      )}
      {open && (
        <form onSubmit={submit}>
          <label htmlFor={id}>Why are you reporting this?</label>
          <input id={id} type="text" value={reason} maxLength={300} required
            onChange={(e) => setReason(e.target.value)} />
          <button type="submit" className="btn btn-primary">Send report</button>
          <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>
            Cancel
          </button>
        </form>
      )}
      {message && <p role="status">{message}</p>}
    </div>
  )
}

export default function QuestionDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [question, setQuestion] = useState(null)
  const [error, setError] = useState('')
  const [body, setBody] = useState('')
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    api
      .get(`/community/questions/${id}/`)
      .then(({ data }) => {
        if (active) setQuestion(data)
      })
      .catch(() => {
        if (active) setError('This question was not found.')
      })
    return () => {
      active = false
    }
  }, [id])

  async function postAnswer(event) {
    event.preventDefault()
    setBusy(true)
    setFormError('')
    try {
      const { data } = await api.post(`/community/questions/${id}/answers/`, { body })
      setQuestion(data)
      setBody('')
    } catch (err) {
      setFormError(problemText(err))
    } finally {
      setBusy(false)
    }
  }

  async function accept(answerId) {
    setFormError('')
    try {
      const { data } = await api.post(`/community/questions/${id}/accept/`, {
        answer: answerId,
      })
      setQuestion(data)
    } catch (err) {
      setFormError(problemText(err))
    }
  }

  if (error) {
    return (
      <section className="section">
        <p role="alert" className="form-error">{error}</p>
        <p><Link to="/community">Back to questions</Link></p>
      </section>
    )
  }
  if (!question) return <section className="section"><p role="status">Loading...</p></section>

  const isAsker = user && user.username === question.author_name

  return (
    <section className="section" aria-labelledby="q-title">
      <p><Link to="/community">Back to questions</Link></p>
      <h1 id="q-title">{question.title}</h1>
      <p>
        {question.crop_name ? `${question.crop_name} · ` : ''}
        {question.district ? `${question.district} · ` : ''}
        asked by {question.author_name}
      </p>
      <p className="chat-message">{question.body}</p>
      {user && !isAsker && (
        <ReportButton url={`/community/questions/${id}/report/`} label="Report this question" />
      )}

      <h2>{question.answers.length} answer(s)</h2>
      {formError && <p role="alert" className="form-error">{formError}</p>}
      <ul className="feature-grid">
        {question.answers.map((a) => (
          <li key={a.id}>
            <article className="feature-card">
              {a.is_accepted && <span className="badge">Accepted answer</span>}
              {a.is_expert && <span className="badge">Verified expert</span>}
              <p><strong>{a.author_name}</strong></p>
              <p className="chat-message">{a.body}</p>
              {isAsker && !a.is_accepted && (
                <button type="button" className="btn btn-secondary"
                  aria-label={`Accept the answer by ${a.author_name}`}
                  onClick={() => accept(a.id)}>
                  Accept this answer
                </button>
              )}
              {user && user.username !== a.author_name && (
                <ReportButton url={`/community/answers/${a.id}/report/`}
                  label={`Report the answer by ${a.author_name}`} />
              )}
            </article>
          </li>
        ))}
      </ul>

      {user ? (
        <form onSubmit={postAnswer} className="order-box">
          <h2>Your answer</h2>
          <label htmlFor="answer-body">Write your answer</label>
          <textarea id="answer-body" rows={4} maxLength={2000} value={body}
            onChange={(e) => setBody(e.target.value)} required />
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Posting...' : 'Post answer'}
          </button>
        </form>
      ) : (
        <p className="notice"><Link to="/login">Log in</Link> to answer.</p>
      )}
    </section>
  )
}
