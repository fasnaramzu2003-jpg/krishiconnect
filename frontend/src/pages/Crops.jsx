
import { useEffect, useState } from 'react'
import ActivityForm from '../components/ActivityForm.jsx'
import AddCropForm from '../components/AddCropForm.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../services/api.js'
import { ACTIVITY_TYPES, STATUS_LABELS } from '../utils/labels.js'
import '../styles/forms.css'

export default function Crops() {
  const { user } = useAuth()
  const [farms, setFarms] = useState([])
  const [crops, setCrops] = useState([])
  const [farmCrops, setFarmCrops] = useState([])
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  async function loadAll() {
    try {
      const [farmsRes, cropsRes, farmCropsRes, activitiesRes] = await Promise.all([
        api.get('/farms/'),
        api.get('/crops/'),
        api.get('/farm-crops/'),
        api.get('/crop-activities/'),
      ])
      setFarms(farmsRes.data.results)
      setCrops(cropsRes.data)
      setFarmCrops(farmCropsRes.data.results)
      setActivities(activitiesRes.data.results)
      setLoadError('')
    } catch {
      setLoadError('Could not load your crops. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  if (user.role !== 'farmer') {
    return (
      <section className="section">
        <h1>My crops</h1>
        <p className="notice">Only farmer accounts can manage crops.</p>
      </section>
    )
  }

  const typeLabel = (value) =>
    ACTIVITY_TYPES.find((type) => type.value === value)?.label || value

  const cropLabel = (id) => {
    const item = farmCrops.find((farmCrop) => farmCrop.id === id)
    return item ? `${item.crop_name} (${item.farm_name})` : 'Unknown crop'
  }

  return (
    <>
      <section className="section" aria-labelledby="crops-title">
        <h1 id="crops-title">My crops</h1>

        {loading && <p role="status">Loading your crops...</p>}
        {loadError && <p role="alert" className="form-error">{loadError}</p>}
        {!loading && !loadError && farmCrops.length === 0 && (
          <p className="section-lead">
            No crops recorded yet. Add your first crop below.
          </p>
        )}

        <ul className="feature-grid">
          {farmCrops.map((item) => (
            <li key={item.id}>
              <article className="feature-card">
                <span className="badge">{STATUS_LABELS[item.status] || item.status}</span>
                <h2>{item.crop_name}</h2>
                <p>{item.farm_name}{item.variety ? ` · ${item.variety}` : ''}</p>
                <p>Planted {item.planting_date} · {item.area_acres} acres</p>
              </article>
            </li>
          ))}
        </ul>
      </section>

      <AddCropForm farms={farms} crops={crops} onSaved={loadAll} />

      <section className="section" aria-labelledby="activities-title">
        <h2 id="activities-title">Recent activities</h2>
        {activities.length === 0 ? (
          <p className="section-lead">No activities logged yet.</p>
        ) : (
          <ul className="activity-list">
            {activities.map((activity) => (
              <li key={activity.id}>
                {activity.date} · {cropLabel(activity.farm_crop)} ·{' '}
                {typeLabel(activity.activity_type)}
                {activity.quantity ? ` · ${activity.quantity} ${activity.unit}` : ''}
              </li>
            ))}
          </ul>
        )}
      </section>

      <ActivityForm farmCrops={farmCrops} onSaved={loadAll} />
    </>
  )
}
