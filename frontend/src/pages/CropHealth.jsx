
import { useEffect, useRef, useState } from 'react'
import FormField from '../components/FormField.jsx'
import api from '../services/api.js'
import { parseApiError } from '../utils/apiErrors.js'
import '../styles/forms.css'

function text(value) {
  return Array.isArray(value) ? value.join(' ') : value || ''
}

function Report({ report }) {
  return (
    <article className="feature-card">
      <h3>{report.crop_name}</h3>
      <img src={report.image} alt={`Photo you uploaded of ${report.crop_name}`} width="240" />
      <p className="chat-message">{report.analysis}</p>
      <p className="notice">{report.disclaimer}</p>
      <p>{new Date(report.created_at).toLocaleString()}</p>
    </article>
  )
}

export default function CropHealth() {
  const summaryRef = useRef(null)
  const [reports, setReports] = useState([])
  const [form, setForm] = useState({ crop_name: '', symptoms_note: '', language: 'en' })
  const [file, setFile] = useState(null)
  const [errors, setErrors] = useState({})
  const [general, setGeneral] = useState('')
  const [busy, setBusy] = useState(false)
  const hasErrors = Object.keys(errors).length > 0 || general !== ''

  function load() {
    api.get('/crop-health/').then(({ data }) => setReports(data.results)).catch(() => {})
  }

  useEffect(() => {
    load()
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
    if (!file) {
      setErrors({ image: 'Please choose a photo.' })
      return
    }
    setBusy(true)
    const body = new FormData()
    body.append('image', file)
    body.append('crop_name', form.crop_name)
    body.append('symptoms_note', form.symptoms_note)
    body.append('language', form.language)
    try {
      await api.post('/crop-health/', body)
      setForm({ crop_name: '', symptoms_note: '', language: form.language })
      setFile(null)
      event.target.reset()
      load()
    } catch (err) {
      const parsed = parseApiError(err)
      setErrors(parsed.fields)
      setGeneral(parsed.general)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <section className="section" aria-labelledby="health-title">
        <h1 id="health-title">Crop health check</h1>
        <p className="section-lead">
          Upload a clear photo of the affected leaf or plant. AI describes what it can
          see. It is not a diagnosis and it does not recommend pesticides.
        </p>
        <form onSubmit={handleSubmit} noValidate className="order-box">
          {hasErrors && (
            <p role="alert" tabIndex={-1} ref={summaryRef} className="form-error">
              {general || 'Please fix the problems below.'}
            </p>
          )}
          <FormField label="Crop name" name="crop_name" value={form.crop_name}
            onChange={handleChange} error={text(errors.crop_name)} required />
          <div className="form-field">
            <label htmlFor="health-photo">Photo (JPEG, PNG or WEBP, up to 8 MB)</label>
            <input id="health-photo" type="file" accept="image/*"
              onChange={(e) => setFile(e.target.files[0] || null)} required
              aria-invalid={Boolean(errors.image)} />
            {errors.image && <p className="form-error">{text(errors.image)}</p>}
          </div>
          <FormField as="textarea" label="What did you notice? (optional)" name="symptoms_note"
            rows={2} value={form.symptoms_note} onChange={handleChange}
            error={text(errors.symptoms_note)} />
          <div className="form-field select-field">
            <label htmlFor="health-lang">Answer language</label>
            <select id="health-lang" name="language" value={form.language}
              onChange={handleChange}>
              <option value="en">English</option>
              <option value="ml">Malayalam (may have mistakes)</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Analysing... this can take a few seconds' : 'Analyse photo'}
          </button>
        </form>
      </section>

      <section className="section" aria-labelledby="past-title">
        <h2 id="past-title">My past checks</h2>
        {reports.length === 0 && <p className="section-lead">No checks yet.</p>}
        <ul className="feature-grid">
          {reports.map((report) => (
            <li key={report.id}><Report report={report} /></li>
          ))}
        </ul>
      </section>
    </>
  )
}
