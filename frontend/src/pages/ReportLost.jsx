import React from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import AddItemForm from '../components/AddItemForm'

export default function ReportLost() {
  const navigate = useNavigate()

  function onAdded(item) {
    // After reporting, set a session flag and go back to student home so Student shows confirmation only
    try { sessionStorage.setItem('justReported', '1') } catch (e) {}
    navigate('/student')
  }

  // protect route: only student role allowed
  React.useEffect(() => {
    const role = typeof window !== 'undefined' ? localStorage.getItem('role') : null
    if (role !== 'student') navigate('/')
  }, [navigate])

  return (
    <div>
      <Navbar />
      <div className="p-6 max-w-2xl mx-auto">
        <AddItemForm onAdded={onAdded} submitLabel="Report" />
      </div>
    </div>
  )
}
