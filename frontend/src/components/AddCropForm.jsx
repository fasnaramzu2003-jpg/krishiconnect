
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api.js'
import { parseApiError } from '../utils/apiErrors.js'
import { STATUS_LABELS } from '../utils/labels.js'
import FormField from './FormField.jsx'

const EMPTY = {
  farm: '',
  crop: '',
  variety: '',
  planting_date: '',
  expected_harvest_date: '',
  area_acres: '',
  status: 'planned',
}

export default function AddCropForm({ farms, crops, onSaved }) {
  const summaryRef = useRef(null)
  const [form, setForm] = useState(EMPTY)
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
      await api.post('/farm-crops/', payload)
      setForm(EMPTY)
      setMessage('Crop added.')
      await onSaved()
    } catch (err) {
      const parsed = parseApiError(err)
      setErrors(parsed.fields)
      setGeneral(parsed.general)
    } finally {
      setSaving(false)
    }
  }

  if (farms.length === 0) {
    return (
      <section className="form-page">
        <h2>Add a crop</h2>
        <p className="notice">
          Add a farm first on the <Link to="/farms">My farms</Link> page.
        </p>
      </section>
    )
  }

  return (
    <section className="form-page" aria-labelledby="add-crop-title">
      <h2 id="add-crop-title">Add a crop</h2>
      <form onSubmit={handleSubmit} noValidate>
        {message && <p role="status" className="success">{message}</p>}
        {hasErrors && (
          <p role="alert" tabIndex={-1} ref={summaryRef} className="form-error">
            {general || 'Please fix the problems below.'}
          </p>
        )}

        <FormField as="select" label="Farm" name="farm" value={form.farm}
          onChange={handleChange} error={errors.farm} required>
          <option value="">Choose a farm</option>
          {farms.map((farm) => (
            <option key={farm.id} value={farm.id}>{farm.name}</option>
          ))}
        </FormField>

        <FormField as="select" label="Crop" name="crop" value={form.crop}
          onChange={handleChange} error={errors.crop} required>
          <option value="">Choose a crop</option>
          {crops.map((crop) => (
            <option key={crop.id} value={crop.id}>{crop.name}</option>
          ))}
        </FormField>

        <FormField label="Variety (optional)" name="variety" type="text"
          value={form.variety} onChange={handleChange} error={errors.variety} />

        <FormField label="Planting date" name="planting_date" type="date"
          value={form.planting_date} onChange={handleChange}
          error={errors.planting_date} required />

        <FormField label="Expected harvest date (optional)" name="expected_harvest_date"
          type="date" value={form.expected_harvest_date} onChange={handleChange}
          error={errors.expected_harvest_date} />

        <FormField label="Area in acres" name="area_acres" type="text"
          inputMode="decimal" value={form.area_acres} onChange={handleChange}
          error={errors.area_acres} required />

        <FormField as="select" label="Status" name="status" value={form.status}
          onChange={handleChange} error={errors.status}>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </FormField>

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Add crop'}
        </button>
      </form>
    </section>
  )
}
