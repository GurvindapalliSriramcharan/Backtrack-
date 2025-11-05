import React from 'react'

export default function Modal({ open, onClose, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded max-w-xl w-full mx-4 shadow-lg">
        <div className="p-3 text-right">
          <button onClick={onClose} className="text-gray-500">Close</button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  )
}
