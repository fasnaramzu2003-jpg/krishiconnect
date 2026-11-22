
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function CallToAction() {
  const { user } = useAuth()

  return (
    <section className="cta" aria-labelledby="cta-title">
      <h2 id="cta-title">The Future of Farming Starts Together.</h2>
      <p>
        {user
          ? `Welcome, ${user.username}. More tools are on the way.`
          : 'Create a free account to follow the early version of KrishiConnect AI.'}
      </p>
      {!user && (
        <Link className="btn btn-light" to="/register">Create your account</Link>
      )}
    </section>
  )
}
