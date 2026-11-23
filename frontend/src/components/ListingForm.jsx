
import { useEffect, useRef, useState } from 'react'
import api from '../services/api.js'
import { parseApiError } from '../utils/apiErrors.js'
import { UNIT_OPTIONS } from '../utils/labels.js'
import FormField from './FormField.jsx'

const EMPTY = {
  farm: '',
  crop: '',
  title: '',
  description: '',
  price_per_unit: '',
  unit: 'kg',
  quantity_available: '',
  min_order_quantity: '1',
  district: '',
}

export default function ListingForm({ farms, crops, onSaved }) {
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
      await api.post('/listings/', payload)
      setForm(EMPTY)
      setMessage('Listing created. You can now add photos below.')
      await onSaved()
    } catch (err) {
      const parsed = parseApiError(err)
      setErrors(parsed.fields)
      setGeneral(parsed.general)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="form-page" aria-labelledby="new-listing-title">
      <h2 id="new-listing-title">Create a listing</h2>
      <form onSubmit={handleSubmit} noValidate>
        {message && <p role="status" className="success">{message}</p>}
        {hasErrors && (
          <p role="alert" tabIndex={-1} ref={summaryRef} className="form-error">
            {general || 'Please fix the problems below.'}
          </p>
        )}

        <FormField label="Title" name="title" type="text" value={form.title}
          onChange={handleChange} error={errors.title} required />

        <FormField as="select" label="Crop" name="crop" value={form.crop}
          onChange={handleChange} error={errors.crop} required>
          <option value="">Choose a crop</option>
          {crops.map((crop) => (
            <option key={crop.id} value={crop.id}>{crop.name}</option>
          ))}
        </FormField>

        <FormField as="select" label="Farm (optional)" name="farm" value={form.farm}
          onChange={handleChange} error={errors.farm}>
          <option value="">No farm selected</option>
          {farms.map((farm) => (
            <option key={farm.id} value={farm.id}>{farm.name}</option>
          ))}
        </FormField>

        <FormField label="Price per unit" name="price_per_unit" type="text"
          inputMode="decimal" value={form.price_per_unit} onChange={handleChange}
          error={errors.price_per_unit} required />

        <FormField as="select" label="Unit" name="unit" value={form.unit}
          onChange={handleChange} error={errors.unit}>
          {UNIT_OPTIONS.map((unit) => (
            <option key={unit.value} value={unit.value}>{unit.label}</option>
          ))}
        </FormField>

        <FormField label="Quantity available" name="quantity_available" type="text"
          inputMode="decimal" value={form.quantity_available} onChange={handleChange}
          error={errors.quantity_available} required />

        <FormField label="Minimum order quantity" name="min_order_quantity" type="text"
          inputMode="decimal" value={form.min_order_quantity} onChange={handleChange}
          error={errors.min_order_quantity} />

        <FormField label="District" name="district" type="text" value={form.district}
          onChange={handleChange} error={errors.district} />

        <FormField as="textarea" label="Description (optional)" name="description"
          rows={3} value={form.description} onChange={handleChange}
          error={errors.description} />

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Create listing'}
        </button>
      </form>
    </section>
  )
}
