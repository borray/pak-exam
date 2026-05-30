import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useExamStore } from '../store'
import type { Exam, Answer, Participant } from '../types'
import {
  generateParticipantId,
  generateSessionCode,
  shuffleArray,
  computeScore,
} from '../utils'

const LETTERS = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З']

function Timer({ seconds, onExpire }: { seconds: number; onExpire: () => void }) {
  const [left, setLeft] = useState(seconds)
  useEffect(() => {
    const id = setInterval(() => {
      setLeft(prev => {
        if (prev <= 1) { clearInterval(id); onExpire(); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [seconds, onExpire])

  const mins = Math.floor(left / 60)
  const secs = left % 60
  const isRed = left < 60

  return (
    <span style={{
      fontFamily: "'PT Mono', monospace",
      fontSize: 18,
      color: isRed ? '#ef4444' : '#e5e5e0',
      fontWeight: isRed ? 'bold' : 'normal',
    }}>
      {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
    </span>
  )
}

interface RegistrationProps {
  exam: Exam
  onStart: (fullName: string, groupClass: string) => void
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void
}

function Registration({ exam, onStart, onImport }: RegistrationProps) {
  const [fullName, setFullName] = useState('')
  const [groupClass, setGroupClass] = useState('')

  return (
    <div style={{ minHeight: '100vh', background: '#fafaf8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 480, width: '100%' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: "'PT Mono', monospace", fontSize: 12, color: '#6b6b6b', letterSpacing: '0.1em', marginBottom: 8 }}>
            {exam.id}
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: '#0a0a0a', margin: '0 0 4px' }}>
            {exam.title}
          </h1>
          <div style={{ fontFamily: "'PT Serif', serif", fontSize: 14, color: '#6b6b6b' }}>
            {exam.subject} · Вариант {exam.variant}
          </div>
          {exam.timeLimit && (
            <div style={{ fontFamily: "'PT Serif', serif", fontSize: 13, color: '#6b6b6b', marginTop: 4 }}>
              Время: {exam.timeLimit} минут · Вопросов: {exam.questions.length}
            </div>
          )}
        </div>

        <div style={{ border: '1px solid #1a1a1a', padding: 24, background: '#fff' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 600, color: '#0a0a0a', marginTop: 0, marginBottom: 16 }}>
            Регистрация участника
          </h2>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontFamily: "'PT Serif', serif", fontSize: 13, color: '#3a3a3a', display: 'block', marginBottom: 4 }}>
              ФИО <span style={{ color: '#999' }}>(необязательно)</span>
            </label>
            <input
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Иванов Иван Иванович"
              style={{
                width: '100%',
                border: '1px solid #d0d0d0',
                padding: '8px 12px',
                fontFamily: "'PT Serif', serif",
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontFamily: "'PT Serif', serif", fontSize: 13, color: '#3a3a3a', display: 'block', marginBottom: 4 }}>
              Группа / Класс <span style={{ color: '#999' }}>(необязательно)</span>
            </label>
            <input
              value={groupClass}
              onChange={e => setGroupClass(e.target.value)}
              placeholder="11А или М-301"
              style={{
                width: '100%',
                border: '1px solid #d0d0d0',
                padding: '8px 12px',
                fontFamily: "'PT Serif', serif",
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            onClick={() => onStart(fullName, groupClass)}
            style={{
              width: '100%',
              background: '#0a0a0a',
              color: '#f5f5f0',
              border: 'none',
              padding: '12px',
              fontFamily: "'Playfair Display', serif",
              fontSize: 15,
              cursor: 'pointer',
              letterSpacing: '0.05em',
            }}
          >
            Начать экзамен
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <label style={{ fontFamily: "'PT Serif', serif", fontSize: 12, color: '#888', cursor: 'pointer' }}>
            Загрузить экзамен из файла (.pak.json)
            <input type="file" accept=".json" style={{ display: 'none' }} onChange={onImport} />
          </label>
        </div>
      </div>
    </div>
  )
}

export function ExamTaking() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { loadAll, getExam, saveSession } = useExamStore()

  const [exam, setExam] = useState<Exam | null>(null)
  const [started, setStarted] = useState(false)
  const [participant, setParticipant] = useState<Participant | null>(null)
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const [questions, setQuestions] = useState(exam?.questions ?? [])
  const sessionCodeRef = useRef<string>('')

  useEffect(() => { loadAll() }, [loadAll])

  useEffect(() => {
    const found = getExam(id!)
    if (found) {
      setExam(found)
    }
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

  function handleStart(fullName: string, groupClass: string) {
    if (!exam) return
    const participantId = generateParticipantId(exam.institutionCode, exam.year)
    const sessionCode = generateSessionCode(participantId, exam.id)
    sessionCodeRef.current = sessionCode

    const p: Participant = {
      id: participantId,
      examId: exam.id,
      fullName: fullName || undefined,
      groupClass: groupClass || undefined,
      issuedAt: new Date().toISOString(),
      sessionCode,
    }
    setParticipant(p)

    let qs = [...exam.questions]
    if (exam.shuffleQuestions) qs = shuffleArray(qs)
    setQuestions(qs)
    setStarted(true)
  }

  function setAnswer(qId: string, answer: Answer) {
    setAnswers(prev => ({ ...prev, [qId]: answer }))
  }

  function handleFinish() {
    if (!exam || !participant) return
    const { score, maxScore } = computeScore(exam, answers)
    const session = {
      sessionCode: sessionCodeRef.current,
      participant,
      exam,
      answers,
      startedAt: participant.issuedAt,
      finishedAt: new Date().toISOString(),
      score,
      maxScore,
    }
    saveSession(session)
    navigate(`/results/${encodeURIComponent(sessionCodeRef.current)}`)
  }

  if (!exam) {
    return (
      <div style={{ minHeight: '100vh', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#555', fontFamily: "'PT Mono', monospace", textAlign: 'center' }}>
          <div>Экзамен не найден</div>
          <div style={{ marginTop: 8, fontSize: 12 }}>ID: {id}</div>
          <div style={{ marginTop: 16 }}>
            <label style={{ color: '#888', cursor: 'pointer', border: '1px solid #444', padding: '8px 16px' }}>
              Загрузить .pak.json
              <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
            </label>
          </div>
        </div>
      </div>
    )
  }

  if (!started) {
    return <Registration exam={exam} onStart={handleStart} onImport={handleImport} />
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fafaf8' }}>
      {/* Header */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: '#fff',
        borderBottom: '1px solid #d0d0d0',
        padding: '10px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <span style={{ fontFamily: "'PT Mono', monospace", fontSize: 12, color: '#6b6b6b' }}>{exam.id}</span>
          <span style={{ fontFamily: "'PT Serif', serif", fontSize: 14, color: '#0a0a0a', marginLeft: 12 }}>{exam.title}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {exam.timeLimit && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: "'PT Serif', serif", fontSize: 13, color: '#6b6b6b' }}>Осталось:</span>
              <Timer seconds={exam.timeLimit * 60} onExpire={handleFinish} />
            </div>
          )}
          <span style={{ fontFamily: "'PT Serif', serif", fontSize: 13, color: '#6b6b6b' }}>
            {Object.keys(answers).length} / {questions.length}
          </span>
          <button
            onClick={() => {
              if (confirm('Завершить экзамен?')) handleFinish()
            }}
            style={{
              background: '#0a0a0a',
              color: '#f5f5f0',
              border: 'none',
              padding: '6px 16px',
              fontFamily: "'PT Serif', serif",
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Завершить
          </button>
        </div>
      </div>

      {/* Questions */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px' }}>
        {questions.map((q, i) => {
          const answer = answers[q.id]
          return (
            <div key={q.id} style={{ marginBottom: 32, paddingBottom: 32, borderBottom: i < questions.length - 1 ? '1px solid #d0d0d0' : 'none' }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <span style={{ fontFamily: "'PT Mono', monospace", fontSize: 14, color: '#6b6b6b', flexShrink: 0 }}>{i + 1}.</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: "'PT Serif', serif", fontSize: 16, color: '#0a0a0a', margin: 0, marginBottom: 4 }}>
                    {q.text}
                  </p>
                  {q.image && <img src={q.image} alt="" style={{ maxWidth: '100%', maxHeight: 200, marginTop: 8 }} />}
                  <span style={{ fontFamily: "'PT Mono', monospace", fontSize: 11, color: '#888' }}>{q.points} б.</span>
                </div>
              </div>

              {/* Answer UI by type */}
              {q.type === 'single' && (
                <div style={{ paddingLeft: 28 }}>
                  {q.options.map((opt, oi) => (
                    <label key={oi} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name={`q_${q.id}`}
                        checked={answer?.type === 'single' && answer.value === oi}
                        onChange={() => setAnswer(q.id, { type: 'single', value: oi })}
                        style={{ width: 16, height: 16 }}
                      />
                      <span style={{ fontFamily: "'PT Serif', serif", fontSize: 15, color: '#0a0a0a' }}>
                        <strong style={{ fontFamily: "'PT Mono', monospace", color: '#6b6b6b', marginRight: 4 }}>{LETTERS[oi]})</strong>
                        {opt}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {q.type === 'multi' && (
                <div style={{ paddingLeft: 28 }}>
                  {q.options.map((opt, oi) => {
                    const checked = answer?.type === 'multi' && answer.value.includes(oi)
                    return (
                      <label key={oi} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={!!checked}
                          onChange={() => {
                            const cur = answer?.type === 'multi' ? answer.value : []
                            const next = checked ? cur.filter(v => v !== oi) : [...cur, oi]
                            setAnswer(q.id, { type: 'multi', value: next })
                          }}
                          style={{ width: 16, height: 16 }}
                        />
                        <span style={{ fontFamily: "'PT Serif', serif", fontSize: 15, color: '#0a0a0a' }}>
                          <strong style={{ fontFamily: "'PT Mono', monospace", color: '#6b6b6b', marginRight: 4 }}>{LETTERS[oi]})</strong>
                          {opt}
                        </span>
                      </label>
                    )
                  })}
                </div>
              )}

              {q.type === 'open' && (
                <div style={{ paddingLeft: 28 }}>
                  <textarea
                    value={answer?.type === 'open' ? answer.value : ''}
                    onChange={e => setAnswer(q.id, { type: 'open', value: e.target.value })}
                    rows={3}
                    placeholder="Введите ответ..."
                    style={{
                      width: '100%',
                      border: '1px solid #d0d0d0',
                      padding: '8px 12px',
                      fontFamily: "'PT Serif', serif",
                      fontSize: 14,
                      resize: 'vertical',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              )}

              {q.type === 'match' && (
                <div style={{ paddingLeft: 28 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div>
                      <div style={{ fontFamily: "'PT Mono', monospace", fontSize: 11, color: '#888', marginBottom: 8 }}>ЛЕВЫЙ СТОЛБЕЦ</div>
                      {q.pairs.map((p, pi) => (
                        <div key={pi} style={{ fontFamily: "'PT Serif', serif", fontSize: 14, padding: '6px 0', borderBottom: '1px solid #eee', color: '#0a0a0a' }}>
                          <strong style={{ fontFamily: "'PT Mono', monospace", color: '#6b6b6b' }}>{pi + 1}.</strong> {p.left}
                        </div>
                      ))}
                    </div>
                    <div>
                      <div style={{ fontFamily: "'PT Mono', monospace", fontSize: 11, color: '#888', marginBottom: 8 }}>ПРАВЫЙ СТОЛБЕЦ</div>
                      {q.pairs.map((p, pi) => (
                        <div key={pi} style={{ fontFamily: "'PT Serif', serif", fontSize: 14, padding: '6px 0', borderBottom: '1px solid #eee', color: '#0a0a0a' }}>
                          <strong style={{ fontFamily: "'PT Mono', monospace", color: '#6b6b6b' }}>{LETTERS[pi]}.</strong> {p.right}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ fontFamily: "'PT Serif', serif", fontSize: 13, color: '#3a3a3a', marginBottom: 8 }}>Установите соответствие:</div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    {q.pairs.map((_, pi) => (
                      <div key={pi} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontFamily: "'PT Mono', monospace", fontSize: 12, color: '#6b6b6b' }}>{pi + 1}</span>
                        <select
                          value={answer?.type === 'match' ? (answer.value[pi] ?? '') : ''}
                          onChange={e => {
                            const cur = answer?.type === 'match' ? { ...answer.value } : {}
                            cur[pi] = Number(e.target.value)
                            setAnswer(q.id, { type: 'match', value: cur })
                          }}
                          style={{
                            border: '1px solid #d0d0d0',
                            padding: '4px',
                            fontFamily: "'PT Mono', monospace",
                            fontSize: 13,
                            outline: 'none',
                          }}
                        >
                          <option value="">—</option>
                          {q.pairs.map((_, ri) => (
                            <option key={ri} value={ri}>{LETTERS[ri]}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {q.type === 'fillblank' && (
                <div style={{ paddingLeft: 28 }}>
                  <p style={{ fontFamily: "'PT Serif', serif", fontSize: 15, color: '#0a0a0a', marginBottom: 12 }}>
                    {q.template.split('___').map((part, pi, arr) => (
                      <span key={pi}>
                        {part}
                        {pi < arr.length - 1 && (
                          <input
                            value={(answer?.type === 'fillblank' ? answer.value[pi] : '') ?? ''}
                            onChange={e => {
                              const cur = answer?.type === 'fillblank' ? [...answer.value] : Array(arr.length - 1).fill('')
                              cur[pi] = e.target.value
                              setAnswer(q.id, { type: 'fillblank', value: cur })
                            }}
                            style={{
                              border: 'none',
                              borderBottom: '1.5px solid #0a0a0a',
                              background: 'transparent',
                              outline: 'none',
                              fontFamily: "'PT Serif', serif",
                              fontSize: 15,
                              width: 100,
                              textAlign: 'center',
                              padding: '0 4px',
                              margin: '0 4px',
                            }}
                          />
                        )}
                      </span>
                    ))}
                  </p>
                </div>
              )}
            </div>
          )
        })}

        <div style={{ textAlign: 'center', paddingTop: 16 }}>
          <button
            onClick={() => {
              if (confirm('Завершить экзамен и перейти к результатам?')) handleFinish()
            }}
            style={{
              background: '#0a0a0a',
              color: '#f5f5f0',
              border: 'none',
              padding: '12px 40px',
              fontFamily: "'Playfair Display', serif",
              fontSize: 16,
              cursor: 'pointer',
              letterSpacing: '0.05em',
            }}
          >
            Завершить экзамен
          </button>
        </div>
      </div>
    </div>
  )
}
