
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api.js'
import { parseApiError } from '../utils/apiErrors.js'
import { RUPEE } from '../utils/labels.js'
import FormField from './FormField.jsx'

function itemsMessage(items) {
  if (!items) return ''
  if (typeof items === 'string') return items
  if (Array.isArray(items)) {
    return items
      .map((entry) =>
        typeof entry === 'string' ? entry : Object.values(entry).flat().join(' '),
      )
      .filter(Boolean)
      .join(' ')
  }
  return ''
}

export default function OrderForm({ listing }) {
  const navigate = useNavigate()
  const summaryRef = useRef(null)
  const [form, setForm] = useState({
    quantity: listing.min_order_quantity,
    delivery_address: '',
    contact_phone: '',
    notes: '',
  })
  const [errors, setErrors] = useState({})
  const [general, setGeneral] = useState('')
  const [saving, setSaving] = useState(false)
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
    setSaving(true)
    const payload = {
      items: [{ listing: listing.id, quantity: form.quantity }],
      delivery_address: form.delivery_address,
      contact_phone: form.contact_phone,
      notes: form.notes,
    }
    try {
      await api.post('/orders/', payload)
      navigate('/orders')
    } catch (err) {
      const parsed = parseApiError(err)
      setErrors(parsed.fields)
      setGeneral(parsed.general)
    } finally {
      setSaving(false)
    }
  }

  const quantityError = [errors.quantity, itemsMessage(errors.items)]
    .flat()
    .filter(Boolean)
    .join(' ')
  const quantity = Number(form.quantity)
  const estimate =
    quantity > 0 ? (Number(listing.price_per_unit) * quantity).toFixed(2) : null

  return (
    <section className="order-box" aria-labelledby="order-title">
      <h2 id="order-title">Place an order</h2>
      <p>
        Your order goes to the seller to confirm. Payment is not handled on this
        platform. Arrange it directly with the seller.
      </p>
      <form onSubmit={handleSubmit} noValidate>
        {hasErrors && (
          <p role="alert" tabIndex={-1} ref={summaryRef} className="form-error">
            {general || 'Please fix the problems below.'}
          </p>
        )}

        <FormField label={`Quantity (${listing.unit})`} name="quantity" type="text"
          inputMode="decimal" value={form.quantity} onChange={handleChange}
          error={quantityError} required />
        {estimate && (
          <p>Estimated total: {RUPEE}{estimate}</p>
        )}

        <FormField as="textarea" label="Delivery address" name="delivery_address"
          rows={3} value={form.delivery_address} onChange={handleChange}
          error={errors.delivery_address} required />

        <FormField label="Contact phone (optional)" name="contact_phone" type="tel"
          value={form.contact_phone} onChange={handleChange}
          error={errors.contact_phone} />

        <FormField as="textarea" label="Notes for the seller (optional)" name="notes"
          rows={2} value={form.notes} onChange={handleChange} error={errors.notes} />

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Placing order...' : 'Place order'}
        </button>
      </form>
    </section>
  )
}
