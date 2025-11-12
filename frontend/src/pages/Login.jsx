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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-indigo-900 to-black">
      <div className="absolute inset-0 bg-[url('/src/assets/geo-bg.svg')] opacity-5 pointer-events-none"></div>

      <div className="relative max-w-md w-full bg-gradient-to-tr from-gray-800/70 to-black/60 backdrop-blur-md border border-gray-700/50 p-8 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-clip-padding bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center shadow-lg">
            <img src="https://cdn.prod.website-files.com/60af144c343b5fdc5513a640/62201bb0b4baad0916cfc7bb_03c756_0a279644d7694f22996bd152f6f8b6be_mv2.png" alt="VNRVJIET logo" className="w-10 h-10 object-contain rounded" />
          </div>
        </div>

  <h2 className="text-2xl font-semibold mb-2 text-center text-white">Welcome to Backtrack</h2>
  <p className="text-sm text-gray-300 text-center mb-6">Sign in to report lost items, view suggestions, and manage claims.</p>

        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <div className="text-xs text-gray-300 mb-1">Username</div>
            <input aria-label="username" className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
          </label>

          <label className="block">
            <div className="text-xs text-gray-300 mb-1">Password</div>
            <input aria-label="password" type="password" className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
          </label>

          <button className="w-full py-2 rounded-lg text-white font-medium bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 shadow">Login</button>
        </form>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <button onClick={() => { setUsername('student'); setPassword('1234') }} className="py-2 rounded-lg border border-gray-700 text-gray-200 bg-gray-800/40 hover:bg-gray-800/60">Student</button>
          <button onClick={() => { setUsername('admin'); setPassword('admin123') }} className="py-2 rounded-lg border border-gray-700 text-gray-200 bg-gray-800/40 hover:bg-gray-800/60">Admin</button>
        </div>

        <div className="mt-4 text-center text-xs text-gray-500">Use demo credentials: <span className="text-gray-300">student / 1234</span> or <span className="text-gray-300">admin / admin123</span></div>
      </div>
    </div>
  )
}
