
import { useEffect, useRef, useState } from 'react'
import api from '../services/api.js'
import { parseApiError } from '../utils/apiErrors.js'
import { ACTIVITY_TYPES } from '../utils/labels.js'
import FormField from './FormField.jsx'

function today() {
  return new Date().toISOString().slice(0, 10)
}

function emptyForm() {
  return {
    farm_crop: '',
    activity_type: 'irrigation',
    date: today(),
    quantity: '',
    unit: '',
    notes: '',
  }
}

export default function ActivityForm({ farmCrops, onSaved }) {
  const summaryRef = useRef(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [general, setGeneral] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const hasErrors = Object.keys(errors).length > 0 || general !== ''

  useEffect(() => {
    if (hasErrors && summaryRef.current) {
      summaryRef.current.focus()
    }
  }, [hasErrors, errors, general])

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setErrors({})
    setGeneral('')
    setMessage('')
    setSaving(true)
    const payload = Object.fromEntries(
      Object.entries(form).filter(([, value]) => value !== ''),
    )
    try {
      await api.post('/crop-activities/', payload)
      setForm(emptyForm())
      setMessage('Activity saved.')
      await onSaved()
    } catch (err) {
      const parsed = parseApiError(err)
      setErrors(parsed.fields)
      setGeneral(parsed.general)
    } finally {
      setSaving(false)
    }
  }

  if (farmCrops.length === 0) {
    return (
      <section className="form-page">
        <h2>Log an activity</h2>
        <p className="notice">Add a crop first, then you can log activities.</p>
      </section>
    )
  }

  return (
    <section className="form-page" aria-labelledby="add-activity-title">
      <h2 id="add-activity-title">Log an activity</h2>
      <form onSubmit={handleSubmit} noValidate>
        {message && <p role="status" className="success">{message}</p>}
        {hasErrors && (
          <p role="alert" tabIndex={-1} ref={summaryRef} className="form-error">
            {general || 'Please fix the problems below.'}
          </p>
        )}

        <FormField as="select" label="Crop" name="farm_crop" value={form.farm_crop}
          onChange={handleChange} error={errors.farm_crop} required>
          <option value="">Choose a crop</option>
          {farmCrops.map((item) => (
            <option key={item.id} value={item.id}>
              {item.crop_name} ({item.farm_name})
            </option>
          ))}
        </FormField>

        <FormField as="select" label="Activity" name="activity_type"
          value={form.activity_type} onChange={handleChange}
          error={errors.activity_type}>
          {ACTIVITY_TYPES.map((type) => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </FormField>

        <FormField label="Date" name="date" type="date" value={form.date}
          onChange={handleChange} error={errors.date} required />

        <FormField label="Quantity (required for harvest)" name="quantity"
          type="text" inputMode="decimal" value={form.quantity}
          onChange={handleChange} error={errors.quantity} />

        <FormField label="Unit (for example kg or litres)" name="unit" type="text"
          value={form.unit} onChange={handleChange} error={errors.unit} />

        <FormField as="textarea" label="Notes (optional)" name="notes" rows={2}
          value={form.notes} onChange={handleChange} error={errors.notes} />

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save activity'}
        </button>
      </form>
    </section>
  )
}
