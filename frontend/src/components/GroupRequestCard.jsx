
import { useState } from 'react'
import { GROUP_STATUS_LABELS, RUPEE } from '../utils/labels.js'

export default function GroupRequestCard({ request, user, busy, error, onAction }) {
  const [quantity, setQuantity] = useState('')
  const isBuyer = user.username === request.buyer_name
  const isFarmer = user.role === 'farmer'
  const needed = Number(request.quantity_needed)
  const filled = Number(request.quantity_filled)
  const canCancel = isBuyer && ['open', 'filled'].includes(request.status)
  const canPledge = isFarmer && !isBuyer && request.status === 'open' && !request.my_pledge
  const pledge = request.my_pledge

  function submitPledge(event) {
    event.preventDefault()
    onAction(request, 'contribute', { quantity })
    setQuantity('')
  }

  return (
    <article className="feature-card">
      <span className="badge">{GROUP_STATUS_LABELS[request.status] || request.status}</span>
      <h3>{request.title}</h3>
      <p>{request.crop_name}{request.district ? ` · ${request.district}` : ''}</p>
      <p className="price">{RUPEE}{request.offered_price_per_unit} / {request.unit}</p>
      <p>Buyer: {request.buyer_name}</p>
      <p>Needed by {request.deadline}</p>

      <label htmlFor={`progress-${request.id}`}>
        {filled} of {needed} {request.unit} pledged by {request.farmers_count} farmer(s)
      </label>
      <progress id={`progress-${request.id}`} value={filled} max={needed} />

      {request.description && <p>{request.description}</p>}
      {error && <p role="alert" className="form-error">{error}</p>}

      {pledge && (
        <p className="notice">
          You pledged {pledge.quantity} {request.unit} ({pledge.status}).
        </p>
      )}
      {pledge && pledge.status === 'pledged' && isFarmer && (
        <button type="button" className="btn btn-secondary" disabled={busy}
          aria-label={`Withdraw my pledge, request ${request.id}`}
          onClick={() => onAction(request, 'withdraw')}>
          Withdraw pledge
        </button>
      )}

      {canPledge && (
        <form onSubmit={submitPledge}>
          <label htmlFor={`pledge-${request.id}`}>
            Quantity you can supply ({request.unit}), up to {request.quantity_remaining}
          </label>
          <input id={`pledge-${request.id}`} type="text" inputMode="decimal"
            value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
          <button type="submit" className="btn btn-primary" disabled={busy}>
            Pledge
          </button>
        </form>
      )}

      {canCancel && (
        <button type="button" className="btn btn-secondary" disabled={busy}
          aria-label={`Cancel request ${request.id}`}
          onClick={() => onAction(request, 'cancel')}>
          Cancel request
        </button>
      )}
    </article>
  )
}
