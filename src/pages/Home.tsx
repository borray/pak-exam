import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useExamStore } from '../store'
import { createNewExam, exportExam, formatDate } from '../utils'

export function Home() {
  const { exams, loadAll, saveExam, deleteExam } = useExamStore()
  const navigate = useNavigate()

  useEffect(() => { loadAll() }, [loadAll])

  function handleNew() {
    const exam = createNewExam(exams)
    saveExam(exam)
    navigate(`/editor/${exam.id}`)
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const exam = JSON.parse(ev.target?.result as string)
        saveExam(exam)
        navigate(`/editor/${exam.id}`)
      } catch {
        alert('Ошибка импорта файла')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="min-h-screen" style={{ background: '#1a1a1a' }}>
      {/* Header */}
      <div style={{ background: '#111', borderBottom: '1px solid #333' }} className="px-8 py-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-baseline gap-4">
            <h1
              style={{ fontFamily: "'Playfair Display', serif", color: '#f5f5f0', fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em' }}
            >
              ПАК
            </h1>
            <span style={{ fontFamily: "'PT Serif', serif", color: '#888', fontSize: 14 }}>
              Программно-Аттестационный Комплекс
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-8">
        {/* Actions */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={handleNew}
            style={{
              background: '#f5f5f0',
              color: '#0a0a0a',
              border: 'none',
              padding: '8px 20px',
              fontFamily: "'PT Serif', serif",
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            + Новый экзамен
          </button>
          <label
            style={{
              background: 'transparent',
              color: '#888',
              border: '1px solid #444',
              padding: '8px 20px',
              fontFamily: "'PT Serif', serif",
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Импорт .pak.json
            <input type="file" accept=".json,.pak.json" className="hidden" onChange={handleImport} />
          </label>
        </div>

        {/* Exams list */}
        {exams.length === 0 ? (
          <div style={{ color: '#555', fontFamily: "'PT Serif', serif", textAlign: 'center', paddingTop: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 16 }}>Экзаменов пока нет</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Создайте новый или импортируйте .pak.json</div>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Table header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '220px 1fr 120px 80px auto',
              gap: 12,
              padding: '6px 12px',
              fontFamily: "'PT Mono', monospace",
              fontSize: 10,
              color: '#555',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              borderBottom: '1px solid #333',
            }}>
              <span>Код</span>
              <span>Название / Предмет</span>
              <span>Дата</span>
              <span>Вопросов</span>
              <span></span>
            </div>

            {exams.map(exam => (
              <div
                key={exam.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '220px 1fr 120px 80px auto',
                  gap: 12,
                  padding: '10px 12px',
                  background: '#1e1e1e',
                  border: '1px solid #2a2a2a',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontFamily: "'PT Mono', monospace", fontSize: 12, color: '#aaa' }}>
                  {exam.id}
                </span>
                <div>
                  <div style={{ fontFamily: "'Playfair Display', serif", color: '#e5e5e0', fontSize: 14 }}>
                    {exam.title}
                  </div>
                  <div style={{ fontFamily: "'PT Serif', serif", color: '#666', fontSize: 12 }}>
                    {exam.subject} · {exam.institution}
                  </div>
                </div>
                <span style={{ fontFamily: "'PT Mono', monospace", fontSize: 11, color: '#555' }}>
                  {formatDate(exam.createdAt)}
                </span>
                <span style={{ fontFamily: "'PT Mono', monospace", fontSize: 12, color: '#666', textAlign: 'center' }}>
                  {exam.questions.length}
                </span>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/editor/${exam.id}`}
                    style={{ color: '#888', fontSize: 12, fontFamily: "'PT Serif', serif", textDecoration: 'none' }}
                    className="hover:text-white transition-colors"
                  >
                    Редактор
                  </Link>
                  <span style={{ color: '#333' }}>|</span>
                  <Link
                    to={`/exam/${exam.id}`}
                    style={{ color: '#888', fontSize: 12, fontFamily: "'PT Serif', serif", textDecoration: 'none' }}
                    className="hover:text-white transition-colors"
                  >
                    Сдать
                  </Link>
                  <span style={{ color: '#333' }}>|</span>
                  <Link
                    to={`/print/${exam.id}`}
                    style={{ color: '#888', fontSize: 12, fontFamily: "'PT Serif', serif", textDecoration: 'none' }}
                    className="hover:text-white transition-colors"
                  >
                    Печать
                  </Link>
                  <span style={{ color: '#333' }}>|</span>
                  <button
                    onClick={() => exportExam(exam)}
                    style={{ color: '#888', fontSize: 12, fontFamily: "'PT Serif', serif", background: 'none', border: 'none', cursor: 'pointer' }}
                    className="hover:text-white transition-colors p-0"
                  >
                    Экспорт
                  </button>
                  <span style={{ color: '#333' }}>|</span>
                  <button
                    onClick={() => {
                      if (confirm(`Удалить экзамен ${exam.id}?`)) deleteExam(exam.id)
                    }}
                    style={{ color: '#555', fontSize: 12, fontFamily: "'PT Serif', serif", background: 'none', border: 'none', cursor: 'pointer' }}
                    className="hover:text-red-400 transition-colors p-0"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
