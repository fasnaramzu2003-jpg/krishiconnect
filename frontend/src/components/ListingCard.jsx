
import { Link } from 'react-router-dom'
import { RUPEE } from '../utils/labels.js'

export default function ListingCard({ listing }) {
  const photo = listing.images[0]
  return (
    <article className="feature-card">
      {photo && (
        <img
          className="listing-image"
          src={photo.image}
          alt={photo.alt_text || listing.title}
          loading="lazy"
        />
      )}
      <h2><Link to={`/marketplace/${listing.id}`}>{listing.title}</Link></h2>
      <p className="price">{RUPEE}{listing.price_per_unit} / {listing.unit}</p>
      <p>{listing.crop_name}{listing.district ? ` · ${listing.district}` : ''}</p>
      <p>{listing.quantity_available} {listing.unit} available</p>
      <p>Seller: {listing.seller_name}{listing.seller_verified ? ' (verified)' : ''}</p>
    </article>
  )
}
