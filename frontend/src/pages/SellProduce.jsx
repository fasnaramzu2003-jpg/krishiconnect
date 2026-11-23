
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ListingForm from '../components/ListingForm.jsx'
import PhotoForm from '../components/PhotoForm.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../services/api.js'
import { LISTING_STATUS_LABELS } from '../utils/labels.js'
import '../styles/forms.css'

export default function SellProduce() {
  const { user } = useAuth()
  const [listings, setListings] = useState([])
  const [farms, setFarms] = useState([])
  const [crops, setCrops] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  async function loadAll() {
    try {
      const [listingsRes, farmsRes, cropsRes] = await Promise.all([
        api.get('/listings/', { params: { mine: 'true' } }),
        api.get('/farms/'),
        api.get('/crops/'),
      ])
      setListings(listingsRes.data.results)
      setFarms(farmsRes.data.results)
      setCrops(cropsRes.data)
      setLoadError('')
    } catch {
      setLoadError('Could not load your listings. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  if (user.role !== 'farmer') {
    return (
      <section className="section">
        <h1>Sell produce</h1>
        <p className="notice">Only farmer accounts can create listings.</p>
      </section>
    )
  }

  return (
    <>
      <section className="section" aria-labelledby="sell-title">
        <h1 id="sell-title">My listings</h1>
        {loading && <p role="status">Loading your listings...</p>}
        {loadError && <p role="alert" className="form-error">{loadError}</p>}
        {!loading && !loadError && listings.length === 0 && (
          <p className="section-lead">You have no listings yet. Create one below.</p>
        )}
        <ul className="activity-list">
          {listings.map((listing) => (
            <li key={listing.id}>
              <Link to={`/marketplace/${listing.id}`}>{listing.title}</Link>
              {' · '}{LISTING_STATUS_LABELS[listing.status] || listing.status}
              {' · '}{listing.quantity_available} {listing.unit}
              {' · '}{listing.images.length} photo(s)
            </li>
          ))}
        </ul>
      </section>

      <ListingForm farms={farms} crops={crops} onSaved={loadAll} />
      <PhotoForm listings={listings} onSaved={loadAll} />
    </>
  )
}
