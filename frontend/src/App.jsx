import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Student from './pages/Student'
import Admin from './pages/Admin'
import ComingSoon from './pages/ComingSoon'
import ReportLost from './pages/ReportLost'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
  <Route path="/student/report-lost" element={<ReportLost />} />
  <Route path="/student/*" element={<Student />} />
      <Route path="/admin/*" element={<Admin />} />
      <Route path="/coming-soon" element={<ComingSoon />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
