
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import OrderForm from '../components/OrderForm.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../services/api.js'
import { RUPEE } from '../utils/labels.js'
import '../styles/forms.css'

export default function ListingDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [listing, setListing] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    api
      .get(`/listings/${id}/`)
      .then(({ data }) => {
        if (!active) return
        setListing(data)
        setError('')
      })
      .catch((err) => {
        if (!active) return
        setError(
          err.response?.status === 404
            ? 'This listing was not found or is no longer available.'
            : 'Could not load the listing. Is the backend running?',
        )
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [id])

  let orderArea = null
  if (listing) {
    if (!user) {
      orderArea = (
        <p className="notice">
          <Link to="/login">Log in</Link> or <Link to="/register">register</Link> to
          place an order.
        </p>
      )
    } else if (user.username === listing.seller_name) {
      orderArea = <p className="notice">This is your listing.</p>
    } else {
      orderArea = <OrderForm listing={listing} />
    }
  }

  return (
    <section className="section" aria-labelledby="listing-title">
      <p><Link to="/marketplace">Back to marketplace</Link></p>

      {loading && <p role="status">Loading...</p>}
      {error && <p role="alert" className="form-error">{error}</p>}

      {listing && (
        <>
          <h1 id="listing-title">{listing.title}</h1>
          <p className="price">{RUPEE}{listing.price_per_unit} / {listing.unit}</p>

          {listing.images.length > 0 && (
            <ul className="detail-images">
              {listing.images.map((image) => (
                <li key={image.id}>
                  <img src={image.image} alt={image.alt_text || listing.title} />
                </li>
              ))}
            </ul>
          )}

          <p>{listing.crop_name}{listing.district ? ` · ${listing.district}` : ''}</p>
          <p>{listing.quantity_available} {listing.unit} available · minimum order{' '}
            {listing.min_order_quantity} {listing.unit}</p>
          <p>Seller: {listing.seller_name}{listing.seller_verified ? ' (verified)' : ''}</p>
          {listing.description && <p>{listing.description}</p>}

          {orderArea}
        </>
      )}
    </section>
  )
}
