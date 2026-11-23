
import { useEffect, useState } from 'react'
import api from '../services/api.js'

export default function useUnreadCount(user) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!user) {
      setCount(0)
      return undefined
    }
    let active = true
    function load() {
      api
        .get('/notifications/unread-count/')
        .then(({ data }) => {
          if (active) setCount(data.count)
        })
        .catch(() => {})
    }
    load()
    const timer = setInterval(load, 60000)
    window.addEventListener('notifications-changed', load)
    return () => {
      active = false
      clearInterval(timer)
      window.removeEventListener('notifications-changed', load)
    }
  }, [user])

  return count
}
