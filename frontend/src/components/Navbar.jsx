
import { NavLink } from 'react-router-dom'

export default function Navbar() {
  return (
    <header className="navbar">
      <NavLink to="/" className="brand">KrishiConnect AI</NavLink>
      <nav aria-label="Main navigation">
        <ul className="nav-links">
          <li><NavLink to="/" end>Home</NavLink></li>
        </ul>
      </nav>
    </header>
  )
}
