import { useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useExamStore } from '../store'
import type { Question, Answer } from '../types'
import { formatDate } from '../utils'

const LETTERS = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З']

function formatAnswer(q: Question, answer: Answer | undefined): string {
  if (!answer) return '—'
  switch (q.type) {
    case 'single':
      if (answer.type !== 'single' || answer.value === null) return '—'
      return `${LETTERS[answer.value]}) ${q.options[answer.value] ?? '?'}`
    case 'multi':
      if (answer.type !== 'multi') return '—'
      return answer.value.map(i => `${LETTERS[i]}) ${q.options[i]}`).join(', ') || '—'
    case 'open':
      if (answer.type !== 'open') return '—'
      return answer.value || '—'
    case 'match':
      if (answer.type !== 'match') return '—'
      return q.pairs.map((_, i) => {
        const ri = answer.value[i]
        return `${i + 1}→${ri !== undefined ? LETTERS[ri] : '?'}`
      }).join(', ')
    case 'fillblank':
      if (answer.type !== 'fillblank') return '—'
      return answer.value.join(', ') || '—'
  }
}

function formatCorrect(q: Question): string {
  switch (q.type) {
    case 'single':
      return `${LETTERS[q.correct]}) ${q.options[q.correct]}`
    case 'multi':
      return q.correct.map(i => `${LETTERS[i]}) ${q.options[i]}`).join(', ')
    case 'open':
      return q.answer ?? 'Ручная проверка'
    case 'match':
      return q.pairs.map((_, i) => `${i + 1}→${LETTERS[i]}`).join(', ')
    case 'fillblank':
      return q.answers.join(', ')
  }
}

function isCorrect(q: Question, answer: Answer | undefined): boolean {
  if (!answer) return false
  switch (q.type) {
    case 'single':
      return answer.type === 'single' && answer.value === q.correct
    case 'multi':
      if (answer.type !== 'multi') return false
      return JSON.stringify([...answer.value].sort()) === JSON.stringify([...q.correct].sort())
    case 'open':
      if (answer.type !== 'open') return false
      return !!q.answer && answer.value.trim().toLowerCase() === q.answer.trim().toLowerCase()
    case 'match':
      if (answer.type !== 'match') return false
      return q.pairs.every((_, i) => answer.value[i] === i)
    case 'fillblank':
      if (answer.type !== 'fillblank') return false
      return q.answers.every((a, i) => answer.value[i]?.trim().toLowerCase() === a.trim().toLowerCase())
  }
}

export function Results() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { loadAll, getSession } = useExamStore()

  useEffect(() => { loadAll() }, [loadAll])

  const session = id ? getSession(decodeURIComponent(id)) : undefined

  if (!session) {
    return (
      <div style={{ minHeight: '100vh', background: '#fafaf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', fontFamily: "'PT Serif', serif" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 18, color: '#0a0a0a' }}>Результаты не найдены</div>
          <div style={{ marginTop: 16 }}>
            <Link to="/" style={{ color: '#6b6b6b', fontSize: 14 }}>← Вернуться на главную</Link>
          </div>
        </div>
      </div>
    )
  }

  const { exam, participant, answers, score = 0, maxScore = 0 } = session
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0

  return (
    <div style={{ minHeight: '100vh', background: '#fafaf8' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #d0d0d0', padding: '12px 32px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link to="/" style={{ fontFamily: "'PT Mono', monospace", fontSize: 12, color: '#6b6b6b', textDecoration: 'none' }}>
          ← Главная
        </Link>
        <span style={{ color: '#d0d0d0' }}>|</span>
        <span style={{ fontFamily: "'PT Mono', monospace", fontSize: 12, color: '#6b6b6b' }}>{exam.id}</span>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => window.print()}
          style={{
            border: '1px solid #d0d0d0',
            background: '#fff',
            padding: '6px 16px',
            fontFamily: "'PT Serif', serif",
            fontSize: 13,
            cursor: 'pointer',
            color: '#3a3a3a',
          }}
          className="no-print"
        >
          Распечатать результаты
        </button>
      </div>

      <div style={{ maxWidth: 840, margin: '0 auto', padding: '40px 24px' }}>
        {/* Score card */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: '#0a0a0a', marginBottom: 8 }}>
            Результаты экзамена
          </div>
          <div style={{ fontFamily: "'PT Serif', serif", fontSize: 14, color: '#6b6b6b', marginBottom: 24 }}>
            {exam.title} · {exam.subject} · Вариант {exam.variant}
          </div>

          <div style={{ display: 'inline-block', border: '2px solid #0a0a0a', padding: '24px 48px' }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 56, fontWeight: 700, color: '#0a0a0a', lineHeight: 1 }}>
              {score}
            </div>
            <div style={{ fontFamily: "'PT Mono', monospace", fontSize: 14, color: '#6b6b6b', marginTop: 4 }}>
              из {maxScore} баллов
            </div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: pct >= 60 ? '#0a0a0a' : '#888', marginTop: 8 }}>
              {pct}%
            </div>
          </div>

          {participant && (
            <div style={{ marginTop: 20, fontFamily: "'PT Serif', serif", fontSize: 14, color: '#3a3a3a' }}>
              {participant.fullName && <div>{participant.fullName}</div>}
              {participant.groupClass && <div>{participant.groupClass}</div>}
              <div style={{ fontFamily: "'PT Mono', monospace", fontSize: 12, color: '#888', marginTop: 4 }}>
                {participant.id} · {formatDate(participant.issuedAt)}
              </div>
            </div>
          )}
        </div>

        {/* Results table */}
        <div style={{ border: '1px solid #d0d0d0' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '40px 1fr 160px 160px 80px',
            gap: 0,
            background: '#0a0a0a',
            color: '#f5f5f0',
            padding: '8px 12px',
            fontFamily: "'PT Mono', monospace",
            fontSize: 11,
            letterSpacing: '0.06em',
          }}>
            <span>№</span>
            <span>ВОПРОС</span>
            <span>ВАШ ОТВЕТ</span>
            <span>ПРАВИЛЬНО</span>
            <span style={{ textAlign: 'right' }}>БАЛЛЫ</span>
          </div>

          {exam.questions.map((q, i) => {
            const answer = answers[q.id]
            const correct = isCorrect(q, answer)
            const earned = correct ? q.points : 0

            return (
              <div
                key={q.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '40px 1fr 160px 160px 80px',
                  gap: 0,
                  padding: '10px 12px',
                  borderBottom: i < exam.questions.length - 1 ? '1px solid #e8e8e8' : 'none',
                  alignItems: 'start',
                  background: correct ? '#f8fff8' : '#fff',
                }}
              >
                <span style={{ fontFamily: "'PT Mono', monospace", fontSize: 12, color: '#888' }}>{i + 1}</span>
                <span style={{ fontFamily: "'PT Serif', serif", fontSize: 13, color: '#0a0a0a' }}>
                  {q.text.length > 80 ? q.text.slice(0, 80) + '…' : q.text}
                </span>
                <span style={{ fontFamily: "'PT Serif', serif", fontSize: 12, color: correct ? '#166534' : '#991b1b' }}>
                  {formatAnswer(q, answer)}
                </span>
                <span style={{ fontFamily: "'PT Serif', serif", fontSize: 12, color: '#3a3a3a' }}>
                  {formatCorrect(q)}
                </span>
                <span style={{
                  fontFamily: "'PT Mono', monospace",
                  fontSize: 12,
                  textAlign: 'right',
                  color: correct ? '#166534' : '#6b6b6b',
                }}>
                  {earned} / {q.points}
                </span>
              </div>
            )
          })}
        </div>

        <div style={{ marginTop: 32, display: 'flex', gap: 12, justifyContent: 'center' }} className="no-print">
          <button
            onClick={() => navigate(`/exam/${exam.id}`)}
            style={{ border: '1px solid #d0d0d0', background: '#fff', padding: '8px 24px', fontFamily: "'PT Serif', serif", fontSize: 14, cursor: 'pointer' }}
          >
            Пройти снова
          </button>
          <button
            onClick={() => navigate(`/print/${exam.id}`)}
            style={{ border: '1px solid #0a0a0a', background: '#0a0a0a', color: '#f5f5f0', padding: '8px 24px', fontFamily: "'PT Serif', serif", fontSize: 14, cursor: 'pointer' }}
          >
            Печать бланка
          </button>
        </div>
      </div>
    </div>
  )
}
