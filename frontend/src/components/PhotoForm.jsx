
import { useEffect, useRef, useState } from 'react'
import api from '../services/api.js'
import { parseApiError } from '../utils/apiErrors.js'
import FormField from './FormField.jsx'

const MAX_BYTES = 2 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export default function PhotoForm({ listings, onSaved }) {
  const fileRef = useRef(null)
  const summaryRef = useRef(null)
  const [listingId, setListingId] = useState('')
  const [altText, setAltText] = useState('')
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

  async function handleSubmit(event) {
    event.preventDefault()
    setErrors({})
    setGeneral('')
    setMessage('')

    const file = fileRef.current?.files?.[0]
    const problems = {}
    if (!listingId) problems.listing = 'Choose a listing.'
    if (!file) {
      problems.image = 'Choose a photo.'
    } else if (!ALLOWED_TYPES.includes(file.type)) {
      problems.image = 'Only JPEG, PNG or WebP photos are allowed.'
    } else if (file.size > MAX_BYTES) {
      problems.image = 'Photo must be 2 MB or smaller.'
    }
    if (Object.keys(problems).length > 0) {
      setErrors(problems)
      return
    }

    const data = new FormData()
    data.append('listing', listingId)
    data.append('image', file)
    if (altText) data.append('alt_text', altText)

    setSaving(true)
    try {
      await api.post('/listing-images/', data)
      fileRef.current.value = ''
      setAltText('')
      setMessage('Photo uploaded.')
      await onSaved()
    } catch (err) {
      const parsed = parseApiError(err)
      setErrors(parsed.fields)
      setGeneral(parsed.general)
    } finally {
      setSaving(false)
    }
  }

  if (listings.length === 0) {
    return (
      <section className="form-page">
        <h2>Add a photo</h2>
        <p className="notice">Create a listing first, then you can add photos.</p>
      </section>
    )
  }

  return (
    <section className="form-page" aria-labelledby="photo-title">
      <h2 id="photo-title">Add a photo</h2>
      <form onSubmit={handleSubmit} noValidate>
        {message && <p role="status" className="success">{message}</p>}
        {hasErrors && (
          <p role="alert" tabIndex={-1} ref={summaryRef} className="form-error">
            {general || 'Please fix the problems below.'}
          </p>
        )}

        <FormField as="select" label="Listing" name="listing" value={listingId}
          onChange={(event) => setListingId(event.target.value)}
          error={errors.listing} required>
          <option value="">Choose a listing</option>
          {listings.map((listing) => (
            <option key={listing.id} value={listing.id}>{listing.title}</option>
          ))}
        </FormField>

        <div className="field">
          <label htmlFor="image">Photo (JPEG, PNG or WebP, up to 2 MB)</label>
          <input
            id="image"
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            ref={fileRef}
            aria-invalid={errors.image ? 'true' : undefined}
            aria-describedby={errors.image ? 'image-error' : undefined}
          />
          {errors.image && (
            <p id="image-error" className="field-error">
              {[].concat(errors.image).join(' ')}
            </p>
          )}
        </div>

        <FormField label="Describe the photo (for screen readers)" name="alt_text"
          type="text" value={altText} onChange={(event) => setAltText(event.target.value)}
          error={errors.alt_text} />

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Uploading...' : 'Upload photo'}
        </button>
      </form>
    </section>
  )
}
