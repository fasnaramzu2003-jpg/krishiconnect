
import { useState } from 'react'
import api from '../services/api.js'
import '../styles/forms.css'

export default function Assistant() {
  const [messages, setMessages] = useState([])
  const [question, setQuestion] = useState('')
  const [language, setLanguage] = useState('en')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    const text = question.trim()
    if (!text) return
    setBusy(true)
    setError('')
    const history = messages.slice(-6).map(({ role, content }) => ({ role, content }))
    try {
      const { data } = await api.post('/assistant/ask/', {
        question: text,
        language,
        history,
      })
      setMessages([
        ...messages,
        { role: 'user', content: text },
        { role: 'assistant', content: data.answer,grounded:data.grounded,sources:data.sources, },
      ])
      setQuestion('')
    } catch (err) {
      const d = err.response?.data
      setError(
        d?.detail || (d?.question && d.question.join(' ')) || 'Could not get an answer.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="section" aria-labelledby="assistant-title">
      <h1 id="assistant-title">Farming assistant</h1>
      <p className="section-lead">
        AI-generated advice. Please confirm with your local Krishi Bhavan or KAU before
        spraying or treating crops. It does not know today's market prices.
      </p>

      <div role="log" aria-live="polite" aria-label="Conversation">
        {messages.map((message, index) => (
          <div key={index}>
            <p className="chat-message">
              <strong>{message.role === 'user' ? 'You: ' : 'Assistant: '}</strong>
              {message.content}
            </p>
            {message.role === 'assistant' && message.grounded === false && (
              <p className="notice">
                No verified reference was found. This is general AI advice.
              </p>
            )}
            {message.sources && message.sources.length > 0 && (
              <ul>
                {message.sources.map((s, i) => (
                  <li key={i}>
                    Reference: {s.title} ({s.source_name}){' '}
                    {s.source_url && (
                      <a href={s.source_url} target="_blank" rel="noreferrer">link</a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}

      </div>

      {error && <p role="alert" className="form-error">{error}</p>}

      <form onSubmit={handleSubmit}>
        <div className="form-field select-field">
          <label htmlFor="assistant-lang">Answer language</label>
          <select id="assistant-lang" value={language}
            onChange={(e) => setLanguage(e.target.value)}>
            <option value="en">English</option>
            <option value="ml">Malayalam (AI Malayalam may have mistakes)</option>
          </select>
        </div>
        <label htmlFor="assistant-question">Your question</label>
        <textarea id="assistant-question" rows={3} maxLength={1000} value={question}
          onChange={(e) => setQuestion(e.target.value)} required />
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Thinking...' : 'Ask'}
        </button>
      </form>
    </section>
  )
}
