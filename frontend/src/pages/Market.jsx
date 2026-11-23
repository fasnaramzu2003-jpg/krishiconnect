
import { useEffect, useState } from 'react'
import api from '../services/api.js'
import { RUPEE } from '../utils/labels.js'
import '../styles/forms.css'

function PriceChart({ points, unit }) {
  const W = 600
  const H = 240
  const P = 44
  const values = points.map((p) => Number(p.avg))
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const x = (i) =>
    points.length === 1 ? W / 2 : P + (i * (W - 2 * P)) / (points.length - 1)
  const y = (v) => H - P - ((v - min) / span) * (H - 2 * P)
  const path = points
    .map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(Number(p.avg))}`)
    .join(' ')
  const label =
    `Average price per ${unit} from ${points[0].date} to ` +
    `${points[points.length - 1].date}, between ${min} and ${max} rupees. ` +
    'The full numbers are in the table below.'

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} style={{ maxWidth: '100%' }}>
      <line x1={P} y1={H - P} x2={W - P} y2={H - P} stroke="#72A879" />
      <line x1={P} y1={P} x2={P} y2={H - P} stroke="#72A879" />
      <path d={path} fill="none" stroke="#176B45" strokeWidth="3" />
      {points.map((p, i) => (
        <circle key={p.date} cx={x(i)} cy={y(Number(p.avg))} r="4" fill="#176B45" />
      ))}
      <text x="4" y={P + 4} fontSize="12" fill="#202B25">{RUPEE}{max}</text>
      <text x="4" y={H - P} fontSize="12" fill="#202B25">{RUPEE}{min}</text>
      <text x={P} y={H - 14} fontSize="12" fill="#202B25">{points[0].date}</text>
      <text x={W - P} y={H - 14} fontSize="12" textAnchor="end" fill="#202B25">
        {points[points.length - 1].date}
      </text>
    </svg>
  )
}

export default function Market() {
  const [crops, setCrops] = useState([])
  const [crop, setCrop] = useState('')
  const [days, setDays] = useState('90')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get('/crops/')
      .then(({ data: list }) => setCrops(Array.isArray(list) ? list : list.results))
      .catch(() => setError('Could not load crops.'))
  }, [])

  useEffect(() => {
    if (!crop) return undefined
    let active = true
    setLoading(true)
    setError('')
    api
      .get('/market/prices/trends/', { params: { crop, days } })
      .then(({ data: result }) => {
        if (active) setData(result)
      })
      .catch(() => {
        if (active) setError('Could not load prices. Is the backend running?')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [crop, days])

  const hasPoints = data && data.points.length > 0

  return (
    <section className="section" aria-labelledby="market-title">
      <h1 id="market-title">Market prices</h1>
      <p className="section-lead">
        Only prices entered from the listed sources are shown. This page does not
        predict future prices.
      </p>

      <div className="form-field select-field">
        <label htmlFor="market-crop">Crop</label>
        <select id="market-crop" value={crop} onChange={(e) => setCrop(e.target.value)}>
          <option value="">Choose a crop</option>
          {crops.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div className="form-field select-field">
        <label htmlFor="market-days">Period</label>
        <select id="market-days" value={days} onChange={(e) => setDays(e.target.value)}>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="180">Last 180 days</option>
        </select>
      </div>

      {loading && <p role="status">Loading prices...</p>}
      {error && <p role="alert" className="form-error">{error}</p>}
      {data && !hasPoints && <p className="notice">{data.note}</p>}

      {hasPoints && (
        <>
          {data.has_demo && (
            <p role="alert" className="form-error">
              This includes DEMO data. Do not use it for real decisions.
            </p>
          )}
          <h2>{data.crop_name}: average price per {data.unit}</h2>
          <PriceChart points={data.points} unit={data.unit} />
          <p>
            {data.change_percent === null
              ? 'Not enough days of data to show a change.'
              : `Change from the first to the last day: ${data.change_percent}%.`}
          </p>
          <p>
            Based on {data.entries} entries from {data.markets} market(s). Sources:{' '}
            {data.sources.join(', ')}.
          </p>
          <p>{data.note}</p>

          <div style={{ overflowX: 'auto' }}>
            <table>
              <caption>Daily prices (rupees per {data.unit})</caption>
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Average</th>
                  <th scope="col">Lowest</th>
                  <th scope="col">Highest</th>
                  <th scope="col">Entries</th>
                </tr>
              </thead>
              <tbody>
                {data.points.map((p) => (
                  <tr key={p.date}>
                    <td>{p.date}</td>
                    <td>{RUPEE}{p.avg}</td>
                    <td>{RUPEE}{p.low}</td>
                    <td>{RUPEE}{p.high}</td>
                    <td>{p.entries}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}
