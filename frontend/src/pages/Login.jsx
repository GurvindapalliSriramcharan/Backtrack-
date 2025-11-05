import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  function submit(e) {
    e.preventDefault()
    if (username === 'student' && password === '1234') {
      // mark role and username in localStorage for simple client-side auth
      localStorage.setItem('role', 'student')
      localStorage.setItem('username', 'student')
      // clear session flags so welcome shows once per login
      try { sessionStorage.removeItem('welcomeShown'); sessionStorage.removeItem('justReported') } catch (e) {}
      navigate('/student')
    } else if (username === 'admin' && password === 'admin123') {
      localStorage.setItem('role', 'admin')
      localStorage.setItem('username', 'admin')
      try { sessionStorage.removeItem('welcomeShown'); sessionStorage.removeItem('justReported') } catch (e) {}
      navigate('/admin')
    } else {
      alert('Invalid credentials. Try student/1234 or admin/admin123')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg">
        <h2 className="text-2xl font-semibold mb-4 text-center">Lost & Found Portal</h2>
        <form onSubmit={submit} className="space-y-4">
          <input className="w-full px-4 py-2 border rounded" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
          <input type="password" className="w-full px-4 py-2 border rounded" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
          <button className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">Login</button>
        </form>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <button onClick={() => { setUsername('student'); setPassword('1234') }} className="py-2 rounded border">Student Login</button>
          <button onClick={() => { setUsername('admin'); setPassword('admin123') }} className="py-2 rounded border">Admin Login</button>
        </div>
      </div>
    </div>
  )
}
