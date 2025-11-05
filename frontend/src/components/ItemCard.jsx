import React from 'react'

export default function ItemCard({ item, onClick, simple }) {
  return (
    <div onClick={onClick} className={`bg-white rounded-lg overflow-hidden shadow hover:shadow-lg cursor-pointer ${simple ? '' : ''}`}>
      <img src={`http://localhost:5000${item.image_path}`} alt={item.name} className="w-full h-40 object-cover" />
      {!simple && (
        <div className="p-3">
          <div className="font-semibold">{item.name}</div>
          <div className="text-sm text-gray-500 mt-1 truncate">{item.description}</div>
        </div>
      )}
    </div>
  )
}
