
import { useEffect, useState } from 'react'
import FormField from '../components/FormField.jsx'
import ListingCard from '../components/ListingCard.jsx'
import api from '../services/api.js'
import '../styles/forms.css'

const EMPTY = { search: '', district: '', min_price: '', max_price: '', ordering: 'newest' }

export default function Marketplace() {
  const [form, setForm] = useState(EMPTY)
  const [query, setQuery] = useState(EMPTY)
  const [page, setPage] = useState(1)
  const [listings, setListings] = useState([])
  const [count, setCount] = useState(0)
  const [hasNext, setHasNext] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    const params = Object.fromEntries(
      Object.entries(query).filter(([, value]) => value !== ''),
    )
    api
      .get('/listings/', { params: { ...params, page } })
      .then(({ data }) => {
        if (!active) return
        setListings(data.results)
        setCount(data.count)
        setHasNext(Boolean(data.next))
        setLoadError('')
      })
      .catch(() => {
        if (active) setLoadError('Could not load listings. Is the backend running?')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [query, page])

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  function handleSubmit(event) {
    event.preventDefault()
    setPage(1)
    setQuery(form)
  }

  function handleClear() {
    setForm(EMPTY)
    setPage(1)
    setQuery(EMPTY)
  }

  return (
    <section className="section" aria-labelledby="market-title">
      <h1 id="market-title">Marketplace</h1>
      <p className="section-lead">
        Fresh produce listed directly by farmers. Contact and payment are arranged
        between buyer and seller.
      </p>

      <form className="filters" onSubmit={handleSubmit} role="search" aria-label="Filter listings">
        <FormField label="Search" name="search" type="text" value={form.search}
          onChange={handleChange} />
        <FormField label="District" name="district" type="text" value={form.district}
          onChange={handleChange} />
        <FormField label="Minimum price" name="min_price" type="text"
          inputMode="decimal" value={form.min_price} onChange={handleChange} />
        <FormField label="Maximum price" name="max_price" type="text"
          inputMode="decimal" value={form.max_price} onChange={handleChange} />
        <FormField as="select" label="Sort by" name="ordering" value={form.ordering}
          onChange={handleChange}>
          <option value="newest">Newest first</option>
          <option value="price">Price: low to high</option>
          <option value="-price">Price: high to low</option>
        </FormField>
        <div className="filter-buttons">
          <button type="submit" className="btn btn-primary">Apply filters</button>
          <button type="button" className="btn btn-secondary" onClick={handleClear}>
            Clear
          </button>
        </div>
      </form>

      <p role="status">
        {loading ? 'Loading listings...' : `${count} listing(s) found`}
      </p>
      {loadError && <p role="alert" className="form-error">{loadError}</p>}

      <ul className="feature-grid">
        {listings.map((listing) => (
          <li key={listing.id}>
            <ListingCard listing={listing} />
          </li>
        ))}
      </ul>

      <nav className="pagination" aria-label="Pagination">
        <button type="button" className="btn btn-secondary" disabled={page === 1}
          onClick={() => setPage(page - 1)}>
          Previous
        </button>
        <span>Page {page}</span>
        <button type="button" className="btn btn-secondary" disabled={!hasNext}
          onClick={() => setPage(page + 1)}>
          Next
        </button>
      </nav>
    </section>
  )
}
