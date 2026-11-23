
import { useEffect, useRef, useState } from 'react'
import api from '../services/api.js'
import { parseApiError } from '../utils/apiErrors.js'
import FormField from './FormField.jsx'

const EMPTY = {
  crop: '',
  title: '',
  description: '',
  quantity_needed: '',
  unit: 'kg',
  offered_price_per_unit: '',
  district: '',
  deadline: '',
}

function text(value) {
  return Array.isArray(value) ? value.join(' ') : value || ''
}

export default function GroupRequestForm({ onCreated }) {
  const summaryRef = useRef(null)
  const [crops, setCrops] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [general, setGeneral] = useState('')
  const [saving, setSaving] = useState(false)
  const hasErrors = Object.keys(errors).length > 0 || general !== ''

  useEffect(() => {
    api
      .get('/crops/')
      .then(({ data }) => setCrops(Array.isArray(data) ? data : data.results))
      .catch(() => setGeneral('Could not load the crop list.'))
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
    try {
      await api.post('/group-requests/', form)
      setForm(EMPTY)
      onCreated()
    } catch (err) {
      const parsed = parseApiError(err)
      setErrors(parsed.fields)
      setGeneral(parsed.general)
    } finally {
      setSaving(false)
    }
  }

  const cropError = text(errors.crop)

  return (
    <section className="order-box" aria-labelledby="gr-form-title">
      <h2 id="gr-form-title">Post a bulk request</h2>
      <p>Tell farmers how much you need. Payment is arranged directly, not on this platform.</p>
      <form onSubmit={handleSubmit} noValidate>
        {hasErrors && (
          <p role="alert" tabIndex={-1} ref={summaryRef} className="form-error">
            {general || 'Please fix the problems below.'}
          </p>
        )}

        <div className="form-field select-field">
          <label htmlFor="gr-crop">Crop</label>
          <select id="gr-crop" name="crop" value={form.crop} onChange={handleChange}
            required aria-invalid={Boolean(cropError)}
            aria-describedby={cropError ? 'gr-crop-error' : undefined}>
            <option value="">Choose a crop</option>
            {crops.map((crop) => (
              <option key={crop.id} value={crop.id}>{crop.name}</option>
            ))}
          </select>
          {cropError && <p id="gr-crop-error" className="form-error">{cropError}</p>}
        </div>

        <FormField label="Title" name="title" value={form.title}
          onChange={handleChange} error={text(errors.title)} required />
        <FormField as="textarea" label="Details (optional)" name="description" rows={2}
          value={form.description} onChange={handleChange} error={text(errors.description)} />
        <FormField label="Quantity needed" name="quantity_needed" inputMode="decimal"
          value={form.quantity_needed} onChange={handleChange}
          error={text(errors.quantity_needed)} required />
        <FormField label="Unit" name="unit" value={form.unit}
          onChange={handleChange} error={text(errors.unit)} required />
        <FormField label="Offered price per unit" name="offered_price_per_unit"
          inputMode="decimal" value={form.offered_price_per_unit} onChange={handleChange}
          error={text(errors.offered_price_per_unit)} required />
        <FormField label="District (optional)" name="district" value={form.district}
          onChange={handleChange} error={text(errors.district)} />
        <FormField label="Deadline" name="deadline" type="date" value={form.deadline}
          onChange={handleChange} error={text(errors.deadline)} required />

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Posting...' : 'Post request'}
        </button>
      </form>
    </section>
  )
}
