
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../services/api.js'

const ROLE_LABELS = {
  farmer: 'farmer',
  buyer: 'buyer',
  expert: 'agricultural expert',
  admin: 'administrator',
}

const ROLE_CARDS = {
  farmer: [
    { title: 'My farms', text: 'Add your farms and fields.', to: '/farms' },
    { title: 'My crops', text: 'Record planting, irrigation and harvests.' },
    { title: 'My listings', text: 'Sell your produce to buyers.' },
  ],
  buyer: [
    { title: 'Browse produce', text: 'Find produce from farmers across Kerala.' },
    { title: 'My orders', text: 'Track your orders.' },
    { title: 'Group sales', text: 'Join group purchases with other buyers.' },
  ],
  expert: [
    { title: 'Farmer questions', text: 'Answer questions from the community.' },
    { title: 'Consultations', text: 'Help farmers one to one.' },
  ],
  admin: [
    { title: 'User verification', text: 'Verify experts and sellers.' },
    { title: 'Moderation', text: 'Review listings and complaints.' },
  ],
}

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    api
      .get('/auth/profile/')
      .then(({ data }) => {
        if (active) setProfile(data.profile)
      })
      .catch((err) => {
        if (!active) return
        if (err.response?.status === 401) {
          logout()
        } else {
          setError('Could not load your profile. Is the backend running?')
        }
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const cards = ROLE_CARDS[user.role] || []

  return (
    <section className="section" aria-labelledby="dash-title">
      <h1 id="dash-title">Welcome, {user.username}</h1>
      <p className="section-lead">
        You are signed in as a {ROLE_LABELS[user.role] || user.role}.
        {profile && ` Location: ${profile.district || 'district not set'}, ${profile.state}.`}
      </p>

      {error && <p role="alert" className="form-error">{error}</p>}

      {user.role === 'expert' && !user.is_verified && (
        <p className="notice">
          Your expert account is waiting for verification by our team.
        </p>
      )}

      <ul className="feature-grid">
        {cards.map((card) => (
          <li key={card.title}>
            <article className="feature-card">
              <span className="badge">{card.to ? 'Available' : 'Planned'}</span>
              <h2>{card.to ? <Link to={card.to}>{card.title}</Link> : card.title}</h2>
              <p>{card.text}</p>
            </article>
          </li>
        ))}
      </ul>
    </section>
  )
}
