import React, { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'

export default function SecurityContacts() {
  const [contacts, setContacts] = useState([])

  useEffect(() => { fetchContacts() }, [])

  function fetchContacts() {
    fetch('http://localhost:5000/api/security')
      .then(r => r.json())
      .then(setContacts)
      .catch(err => console.error(err))
  }

  useEffect(() => {
    function onUpdate() { fetchContacts() }
    window.addEventListener('security:updated', onUpdate)
    return () => window.removeEventListener('security:updated', onUpdate)
  }, [])

  return (
    <div>
      <Navbar />
      <div className="p-6 max-w-4xl mx-auto">
        <h3 className="text-lg font-semibold mb-4">Security Contacts</h3>
        {contacts.length === 0 ? (
          <div className="bg-white rounded p-6 shadow text-center text-gray-500">No security contacts yet</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {contacts.map(c => (
              <div key={c.id} className="bg-white rounded p-4 shadow">
                <div className="font-semibold">{c.name}</div>
                <div className="text-sm text-gray-600">{c.designation || '—'}</div>
                <div className="text-sm text-gray-500">Location: {c.location || '—'}</div>
                <div className="text-sm text-indigo-600">Phone: {c.phone}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
