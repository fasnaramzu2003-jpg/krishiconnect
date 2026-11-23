
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../services/api.js'
import { ORDER_STATUS_LABELS, RUPEE } from '../utils/labels.js'
import '../styles/forms.css'

const SELLER_ACTIONS = {
  pending: [['confirmed', 'Confirm order'], ['cancelled', 'Reject order']],
  confirmed: [['delivered', 'Mark delivered'], ['cancelled', 'Cancel order']],
}

function OrderCard({ order, role, busy, onAction }) {
  const other = role === 'seller' ? `Buyer: ${order.buyer_name}` : `Seller: ${order.seller_name}`
  let actions = []
  if (role === 'seller') {
    actions = SELLER_ACTIONS[order.status] || []
  } else if (order.status === 'pending') {
    actions = [['cancelled', 'Cancel order']]
  }

  return (
    <article className="feature-card">
      <span className="badge">{ORDER_STATUS_LABELS[order.status] || order.status}</span>
      <h3>Order #{order.id}</h3>
      <p>{other}</p>
      <ul className="order-items">
        {order.items.map((item) => (
          <li key={item.id}>
            {item.listing_title}: {item.quantity} {item.unit} × {RUPEE}{item.unit_price}
          </li>
        ))}
      </ul>
      <p className="price">Total {RUPEE}{order.total_amount}</p>
      <p>Placed on {new Date(order.created_at).toLocaleDateString()}</p>
      <p>Deliver to: {order.delivery_address}</p>
      {order.contact_phone && <p>Phone: {order.contact_phone}</p>}
      {order.notes && <p>Notes: {order.notes}</p>}
      {actions.length > 0 && (
        <div className="filter-buttons">
          {actions.map(([status, label]) => (
            <button
              key={status}
              type="button"
              className="btn btn-secondary"
              disabled={busy}
              aria-label={`${label}, order ${order.id}`}
              onClick={() => onAction(order, status)}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </article>
  )
}

export default function Orders() {
  const { user } = useAuth()
  const [placed, setPlaced] = useState([])
  const [received, setReceived] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [actionError, setActionError] = useState('')

  async function loadOrders() {
    try {
      const [placedRes, receivedRes] = await Promise.all([
        api.get('/orders/'),
        api.get('/orders/', { params: { as: 'seller' } }),
      ])
      setPlaced(placedRes.data.results)
      setReceived(receivedRes.data.results)
      setLoadError('')
    } catch {
      setLoadError('Could not load your orders. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  async function changeStatus(order, status) {
    setBusy(true)
    setMessage('')
    setActionError('')
    try {
      await api.post(`/orders/${order.id}/status/`, { status })
      setMessage(`Order #${order.id} updated.`)
      await loadOrders()
    } catch (err) {
      const problem = err.response?.data?.status || err.response?.data?.detail
      setActionError(
        (Array.isArray(problem) ? problem.join(' ') : problem) ||
          'Could not update the order.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <section className="section" aria-labelledby="orders-title">
        <h1 id="orders-title">Orders</h1>
        {loading && <p role="status">Loading your orders...</p>}
        {loadError && <p role="alert" className="form-error">{loadError}</p>}
        {message && <p role="status" className="success">{message}</p>}
        {actionError && <p role="alert" className="form-error">{actionError}</p>}

        <h2>Orders I placed</h2>
        {!loading && placed.length === 0 && (
          <p className="section-lead">You have not placed any orders yet.</p>
        )}
        <ul className="feature-grid">
          {placed.map((order) => (
            <li key={order.id}>
              <OrderCard order={order} role="buyer" busy={busy} onAction={changeStatus} />
            </li>
          ))}
        </ul>
      </section>

      {user.role === 'farmer' && (
        <section className="section" aria-labelledby="received-title">
          <h2 id="received-title">Orders for my produce</h2>
          {!loading && received.length === 0 && (
            <p className="section-lead">No one has ordered from you yet.</p>
          )}
          <ul className="feature-grid">
            {received.map((order) => (
              <li key={order.id}>
                <OrderCard order={order} role="seller" busy={busy} onAction={changeStatus} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}
