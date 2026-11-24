
import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import useUnreadCount from '../hooks/useUnreadCount.js'

export default function Navbar() {
  const { user, logout } = useAuth()
  const unread = useUnreadCount(user)
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  async function handleLogout() {
    await logout()
    setOpen(false)
    navigate('/')
  }

  const close = () => setOpen(false)

  return (
    <header className="navbar">
      <NavLink to="/" className="brand" onClick={close}>KrishiConnect AI</NavLink>
      <button
        type="button"
        className="nav-toggle"
        aria-expanded={open}
        aria-controls="main-nav"
        onClick={() => setOpen(!open)}
      >
        {open ? 'Close' : 'Menu'}
      </button>
      <nav id="main-nav" aria-label="Main navigation" className={open ? 'open' : ''}>
        <ul className="nav-links" onClick={close}>
          <li><NavLink to="/" end>Home</NavLink></li>
          <li><NavLink to="/marketplace">Marketplace</NavLink></li>
          <li><NavLink to="/community">Community</NavLink></li>
          {user ? (
            <>
              <li><NavLink to="/dashboard">Dashboard</NavLink></li>
              <li><NavLink to="/orders">Orders</NavLink></li>
              <li><NavLink to="/notifications">Notifications{unread > 0 ? ` (${unread})` : ''}</NavLink></li>
              <li><NavLink to="/group-sales">Group selling</NavLink></li>
              <li><NavLink to="/assistant">Assistant</NavLink></li>
              <li><NavLink to="/crop-health">Crop health</NavLink></li>
              <li><NavLink to="/market">Market</NavLink></li>
              <li><span>Hello, {user.username}</span></li>
              <li>
                <button type="button" className="link-button" onClick={handleLogout}>Log out</button>
              </li>
            </>
          ) : (
            <>
              <li><NavLink to="/login">Log in</NavLink></li>
              <li><NavLink to="/register">Register</NavLink></li>
            </>
          )}
        </ul>
      </nav>
    </header>
  )
}
