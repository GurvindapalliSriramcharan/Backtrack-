import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

const links = [
  { to: '/student', label: 'Home' },
  { to: '/student/report-lost', label: 'Report Lost' },
  { to: '/coming-soon', label: 'Claimed Items' },
  { to: '/coming-soon', label: 'Resale' },
  { to: '/coming-soon', label: 'Security Contacts' },
  { to: '/coming-soon', label: 'Feedback About App' }
]

export default function Navbar() {
  const navigate = useNavigate()
  const role = typeof window !== 'undefined' ? localStorage.getItem('role') : null

  function logout() {
    localStorage.removeItem('role')
    // optional: clear other storage if used
    navigate('/')
  }

  return (
    <div className="bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="font-semibold">Lost & Found</div>
        <div className="flex items-center space-x-4">
          <div className="space-x-3">
            {links.map(l => (
              <NavLink key={l.to + l.label} to={l.to} className={({isActive}) => isActive ? 'text-indigo-600 font-medium' : 'text-gray-600'}>{l.label}</NavLink>
            ))}
          </div>

          {role && (
            <button onClick={logout} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">Logout</button>
          )}
        </div>
      </div>
    </div>
  )
}
