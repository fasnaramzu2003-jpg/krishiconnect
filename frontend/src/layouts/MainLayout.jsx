import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'

export default function MainLayout() {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <Navbar />
      <main id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="footer">
        <p>© 2026 KrishiConnect AI · Early development version</p>
      </footer>
    </>
  )
}
