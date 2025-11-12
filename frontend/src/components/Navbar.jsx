import React, { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

export default function Navbar() {
  const navigate = useNavigate()
  const role = typeof window !== 'undefined' ? localStorage.getItem('role') : null

  const links = role === 'student' ? [
    { to: '/student', label: 'Home' },
  { to: '/student/report-lost', label: 'Report Lost' },
  { to: '/coming-soon', label: 'Claimed Items' },
  { to: '/security', label: 'Security Contacts' },
    { to: '/coming-soon', label: 'Feedback About App' }
  ] : role === 'admin' ? [
  { to: '/admin', label: 'Home' },
  { to: '/coming-soon', label: 'Claimed Items' },
  { to: '/coming-soon', label: 'Resale' },
  { to: '/security', label: 'Security Contacts' }
  ] : []

  const [notifications, setNotifications] = useState([])
  const [openBell, setOpenBell] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const user = typeof window !== 'undefined' ? localStorage.getItem('username') : null
        if (!user) return
        const r = await fetch(`http://localhost:5000/api/notifications?user=${encodeURIComponent(user)}`)
        const data = await r.json()
        // If student has no notifications, show a demo 'match found' notification so the bell demo is visible
        const role = typeof window !== 'undefined' ? localStorage.getItem('role') : null
        if (role === 'student' && (!data || (Array.isArray(data) && data.length === 0))) {
          const demo = {
            id: 'demo-phone-1',
            username: user,
            message: 'Possible match: Smartphone (Library)',
            type: 'match',
            payload: JSON.stringify({ item_id: 2 }), // seeded 'Smartphone' item in DB
            read: 0,
            created_at: new Date().toISOString()
          }
          setNotifications([demo])
        } else {
          setNotifications(data || [])
        }
      } catch (e) { console.error(e) }
    }
    load()
    const iv = setInterval(load, 10000)

    // Also reload when other parts of the app signal notifications changed
    function onUpdate() { load() }
    window.addEventListener('notifications:updated', onUpdate)

    return () => { clearInterval(iv); window.removeEventListener('notifications:updated', onUpdate) }
  }, [])

  function logout() {
    localStorage.removeItem('role')
    // optional: clear other storage if used
    navigate('/')
  }

  return (
    <div className="bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
  <div className="font-semibold">Backtrack</div>
        <div className="flex items-center space-x-4">
          <div className="space-x-3">
            {links.map(l => (
              <NavLink key={l.to + l.label} to={l.to} className={({isActive}) => isActive ? 'text-indigo-600 font-medium' : 'text-gray-600'}>{l.label}</NavLink>
            ))}
          </div>

          {role && (
            <>
              <div className="relative">
                <button title="Notifications" onClick={() => setOpenBell(s => !s)} className="px-2 py-1 rounded hover:bg-gray-100">
                  🔔
                  {notifications && notifications.filter(n => !n.read).length > 0 && (
                    <span className="inline-block ml-1 px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">{notifications.filter(n => !n.read).length}</span>
                  )}
                </button>

                {openBell && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border rounded shadow-lg z-50 p-2 text-gray-800">
                    <div className="text-xs text-gray-500 mb-2">Notifications</div>
                    {notifications.length === 0 && <div className="text-sm text-gray-500">No notifications</div>}
                    <div className="space-y-2 max-h-64 overflow-auto">
                      {notifications.map(n => (
                        <div key={n.id} className="p-2 border rounded bg-gray-50">
                          <div className="text-sm text-gray-900">{n.message}</div>
                          <div className="text-xs text-gray-500 mt-1">{new Date(n.created_at).toLocaleString()}</div>
                          {/* If this is a match suggestion allow request claim */}
                          {n.type === 'match' && n.payload && (() => {
                            try { const p = JSON.parse(n.payload || '{}'); return p.item_id } catch (e) { return null }
                          })() && (
                            <div className="mt-2 flex gap-2">
                              <button onClick={async () => {
                                try {
                                  const user = typeof window !== 'undefined' ? localStorage.getItem('username') : null
                                  const payload = JSON.parse(n.payload || '{}')
                                  await fetch('http://localhost:5000/api/claims', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ item_id: payload.item_id, student: user, message: 'Requesting to claim (from suggestion)' })
                                  })
                                  // refresh notifications after creating claim
                                  const r = await fetch(`http://localhost:5000/api/notifications?user=${encodeURIComponent(user)}`)
                                  const data = await r.json()
                                  setNotifications(data || [])
                                  alert('Claim request sent')
                                } catch (e) { console.error(e); alert('Failed to send claim request') }
                              }} className="px-2 py-1 text-xs bg-indigo-600 text-white rounded">Request Claim</button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button onClick={logout} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">Logout</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
