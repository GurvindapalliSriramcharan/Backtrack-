import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import ItemCard from '../components/ItemCard'

export default function Student() {
  const [items, setItems] = useState([])
  const [myReports, setMyReports] = useState([])

  useEffect(() => {
    // If report was just submitted, show only that confirmation.
    const justReported = typeof window !== 'undefined' ? sessionStorage.getItem('justReported') : null
    if (justReported) {
      try { sessionStorage.removeItem('justReported') } catch (e) {}
      alert('Report submitted — thank you!')
    } else {
      // show welcome once per login/session
      const welcomeShown = typeof window !== 'undefined' ? sessionStorage.getItem('welcomeShown') : null
      if (!welcomeShown) {
        alert('🎉 Welcome to Lost and Found!')
        try { sessionStorage.setItem('welcomeShown', '1') } catch (e) {}
      }
    }
    fetchItems()
  }, [])

  // protect route: only student role allowed
  const navigate = useNavigate()
  useEffect(() => {
    const role = typeof window !== 'undefined' ? localStorage.getItem('role') : null
    if (role !== 'student') navigate('/')
  }, [navigate])

  function fetchItems() {
    fetch('http://localhost:5000/api/items')
      .then(r => r.json())
      .then(data => {
        setItems(data)
        try {
          const user = typeof window !== 'undefined' ? localStorage.getItem('username') : null
          if (user) {
            const mine = data.filter(i => i.reported_by === user)
            setMyReports(mine)
          } else setMyReports([])
        } catch (e) { setMyReports([]) }
      })
      .catch(err => console.error(err))
  }

  return (
    <div>
      <Navbar />
      <div className="p-6">
        {myReports && myReports.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">My Reports</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {myReports.map(item => (
                <div key={item.id} className="bg-white rounded-lg overflow-hidden shadow p-3">
                  <img src={`http://localhost:5000${item.image_path || ''}`} alt={item.name} className="w-full h-36 object-cover mb-2" />
                  <div className="font-semibold">{item.name}</div>
                  <div className="text-sm text-gray-600">{item.description}</div>
                  <div className="text-sm text-gray-500 mt-1">Location: {item.location || '—'}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {items.filter(i => !i.reported_by).map(item => (
            <ItemCard key={item.id} item={item} simple />
          ))}
        </div>
      </div>
    </div>
  )
}
