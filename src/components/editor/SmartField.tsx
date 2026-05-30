import { useState } from 'react'

interface Props {
  label: string
  value: string
  autoValue: string
  onSave: (value: string) => void
  onReset: () => void
  type?: 'text' | 'number'
  className?: string
}

export function SmartField({ label, value, autoValue, onSave, onReset, type = 'text', className = '' }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const isAuto = value === autoValue

  function startEdit() {
    setDraft(value)
    setEditing(true)
  }

  function commit() {
    onSave(draft)
    setEditing(false)
  }

  function handleReset() {
    onReset()
    setEditing(false)
    setDraft(autoValue)
  }

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-xs text-gray-400 uppercase tracking-wider">{label}</label>
      <div className="flex items-center gap-1">
        {editing ? (
          <>
            <input
              type={type}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
              autoFocus
              className="flex-1 bg-white text-gray-900 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-400"
            />
            <button
              onClick={handleReset}
              title="Сбросить к авто-значению"
              className="p-1 text-gray-400 hover:text-orange-400 transition-colors text-sm"
            >
              🔄
            </button>
          </>
        ) : (
          <>
            <div
              className={`flex-1 px-2 py-1 text-sm rounded border ${isAuto ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-700 border-gray-600 text-white'} font-mono`}
            >
              {value || <span className="text-gray-500 italic">не задано</span>}
            </div>
            <button
              onClick={startEdit}
              title="Редактировать"
              className="p-1 text-gray-400 hover:text-gray-200 transition-colors text-sm"
            >
              ✏️
            </button>
            {!isAuto && (
              <button
                onClick={handleReset}
                title="Сбросить к авто-значению"
                className="p-1 text-gray-400 hover:text-orange-400 transition-colors text-sm"
              >
                🔄
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
