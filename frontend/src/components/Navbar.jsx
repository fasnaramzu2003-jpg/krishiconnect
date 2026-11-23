
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <header className="navbar">
      <NavLink to="/" className="brand">KrishiConnect AI</NavLink>
      <nav aria-label="Main navigation">
        <ul className="nav-links">
          <li><NavLink to="/" end>Home</NavLink></li>
          <li><NavLink to="/marketplace">Marketplace</NavLink></li>
          {user ? (
            <>
              <li><NavLink to="/dashboard">Dashboard</NavLink></li>
              <li><NavLink to="/orders">Orders</NavLink></li>
              <li><NavLink to="/group-sales">Group selling</NavLink></li>
              <li><NavLink to="/assistant">Assistant</NavLink></li>
              <li><NavLink to="/crop-health">Crop health</NavLink></li>
              <li><span>Hello, {user.username}</span></li>
              <li>
                <button type="button" className="link-button" onClick={handleLogout}>
                  Log out
                </button>
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
