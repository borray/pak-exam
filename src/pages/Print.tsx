import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useExamStore } from '../store'
import { PrintDocument } from '../components/print/PrintDocument'
import type { Exam } from '../types'

export function Print() {
  const { id } = useParams<{ id: string }>()
  const { loadAll, getExam } = useExamStore()
  const [exam, setExam] = useState<Exam | null>(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => { loadAll() }, [loadAll])
  useEffect(() => {
    const found = getExam(id!)
    if (found) setExam(found)
  }, [id, getExam])

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const imported = JSON.parse(ev.target?.result as string) as Exam
        setExam(imported)
      } catch {
        alert('Ошибка импорта')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  async function handlePDF() {
    setDownloading(true)
    try {
      const { default: jsPDF } = await import('jspdf')
      const { default: html2canvas } = await import('html2canvas')
      const el = document.getElementById('print-document')
      if (!el) return

      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
      const imgData = canvas.toDataURL('image/jpeg', 0.95)

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pdfW = pdf.internal.pageSize.getWidth()
      const pdfH = (canvas.height / canvas.width) * pdfW
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, pdfH)
      pdf.save(`${exam?.id ?? 'exam'}.pdf`)
    } finally {
      setDownloading(false)
    }
  }

  if (!exam) {
    return (
      <div style={{ minHeight: '100vh', background: '#2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#555', fontFamily: "'PT Mono', monospace", textAlign: 'center' }}>
          <div>Экзамен не найден</div>
          <div style={{ marginTop: 16 }}>
            <label style={{ color: '#888', cursor: 'pointer', border: '1px solid #444', padding: '8px 16px' }}>
              Загрузить .pak.json
              <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
            </label>
          </div>
          <div style={{ marginTop: 12 }}>
            <Link to="/" style={{ color: '#666', fontSize: 12 }}>← Главная</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: '#2a2a2a', minHeight: '100vh' }}>
      {/* Controls — hidden on print */}
      <div
        className="no-print"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: '#111',
          borderBottom: '1px solid #333',
          padding: '10px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Link to="/" style={{ fontFamily: "'PT Mono', monospace", fontSize: 12, color: '#555', textDecoration: 'none' }}>
          ← ПАК
        </Link>
        <Link to={`/editor/${exam.id}`} style={{ fontFamily: "'PT Mono', monospace", fontSize: 12, color: '#555', textDecoration: 'none' }}>
          Редактор
        </Link>
        <div style={{ flex: 1 }} />
        <span style={{ fontFamily: "'PT Mono', monospace", fontSize: 11, color: '#555' }}>{exam.id}</span>
        <button
          onClick={() => window.print()}
          style={{
            background: '#f5f5f0',
            color: '#0a0a0a',
            border: 'none',
            padding: '7px 20px',
            fontFamily: "'PT Serif', serif",
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Печать
        </button>
        <button
          onClick={handlePDF}
          disabled={downloading}
          style={{
            background: 'transparent',
            color: downloading ? '#555' : '#ccc',
            border: '1px solid #444',
            padding: '7px 20px',
            fontFamily: "'PT Serif', serif",
            fontSize: 13,
            cursor: downloading ? 'wait' : 'pointer',
          }}
        >
          {downloading ? 'Генерация...' : 'Скачать PDF'}
        </button>
      </div>

      {/* Document */}
      <div style={{ paddingTop: 60, paddingBottom: 40, display: 'flex', justifyContent: 'center' }} className="no-print">
        <div style={{ boxShadow: '0 8px 48px rgba(0,0,0,0.6)' }}>
          <PrintDocument exam={exam} />
        </div>
      </div>

      {/* Print-only: raw document */}
      <div className="print-only" style={{ display: 'none' }}>
        <PrintDocument exam={exam} />
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white; }
        }
      `}</style>
    </div>
  )
}
