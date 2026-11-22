
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import '../styles/forms.css'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const summaryRef = useRef(null)
  const [form, setForm] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    role: 'farmer',
    preferred_language: 'en',
  })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)

  const hasErrors = Object.keys(errors).length > 0 || formError !== ''

  useEffect(() => {
    if (hasErrors && summaryRef.current) {
      summaryRef.current.focus()
    }
  }, [hasErrors, errors, formError])

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setErrors({})
    setFormError('')
    setLoading(true)
    try {
      await register(form)
      navigate('/')
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object' && !data.detail) {
        setErrors(data)
      } else {
        setFormError(data?.detail || 'Could not register. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const fieldProps = (name) => ({
    id: name,
    name,
    value: form[name],
    onChange: handleChange,
    'aria-invalid': errors[name] ? 'true' : undefined,
    'aria-describedby': errors[name] ? `${name}-error` : undefined,
  })

  const errorText = (name) =>
    errors[name] ? (
      <p id={`${name}-error`} className="field-error">
        {[].concat(errors[name]).join(' ')}
      </p>
    ) : null

  return (
    <section className="form-page">
      <h1>Create your account</h1>
      <form onSubmit={handleSubmit} noValidate>
        {hasErrors && (
          <p role="alert" tabIndex={-1} ref={summaryRef} className="form-error">
            {formError || 'Please fix the problems below.'}
          </p>
        )}

        <div className="field">
          <label htmlFor="username">Username</label>
          <input {...fieldProps('username')} type="text" autoComplete="username" required />
          {errorText('username')}
        </div>

        <div className="field">
          <label htmlFor="email">Email</label>
          <input {...fieldProps('email')} type="email" autoComplete="email" required />
          {errorText('email')}
        </div>

        <div className="field">
          <label htmlFor="phone">Phone (optional)</label>
          <input {...fieldProps('phone')} type="tel" autoComplete="tel" />
          {errorText('phone')}
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <input {...fieldProps('password')} type="password" autoComplete="new-password" required />
          {errorText('password')}
        </div>

        <div className="field">
          <label htmlFor="role">I am a</label>
          <select {...fieldProps('role')}>
            <option value="farmer">Farmer</option>
            <option value="buyer">Buyer</option>
            <option value="expert">Agricultural expert</option>
          </select>
          {errorText('role')}
        </div>

        <div className="field">
          <label htmlFor="preferred_language">Preferred language</label>
          <select {...fieldProps('preferred_language')}>
            <option value="en">English</option>
            <option value="ml">Malayalam</option>
          </select>
          {errorText('preferred_language')}
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>
      <p>Already have an account? <Link to="/login">Log in</Link></p>
    </section>
  )
}
