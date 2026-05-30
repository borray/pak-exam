import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { useExamStore } from '../store'
import {
  createNewExam,
  createQuestion,
  getSubjectAbbr,
  generateExamId,
  getNextVariant,
  saveLastInstitutionCode,
  exportExam,
  QUESTION_TYPE_LABELS,
} from '../utils'
import type { Exam, Question, QuestionType } from '../types'
import { QuestionEditor } from '../components/editor/QuestionEditor'
import { PrintDocument } from '../components/print/PrintDocument'
import { SmartField } from '../components/editor/SmartField'

function useAutoSave(exam: Exam | null, saveExam: (e: Exam) => void) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!exam) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => saveExam(exam), 400)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [exam, saveExam])
}

export function Editor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { exams, loadAll, saveExam, getExam } = useExamStore()
  const [exam, setExam] = useState<Exam | null>(null)
  const [showAddMenu, setShowAddMenu] = useState(false)

  useEffect(() => { loadAll() }, [loadAll])

  useEffect(() => {
    if (!exams.length && id === 'new') return
    if (id === 'new') {
      const newExam = createNewExam(exams)
      saveExam(newExam)
      navigate(`/editor/${newExam.id}`, { replace: true })
      return
    }
    const found = getExam(id!)
    if (found) {
      setExam(found)
    } else if (exams.length > 0) {
      navigate('/', { replace: true })
    }
  }, [id, exams, getExam, saveExam, navigate])

  useAutoSave(exam, saveExam)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const update = useCallback((patch: Partial<Exam>) => {
    setExam(prev => prev ? { ...prev, ...patch } : null)
  }, [])

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id || !exam) return
    const oldIdx = exam.questions.findIndex(q => q.id === active.id)
    const newIdx = exam.questions.findIndex(q => q.id === over.id)
    update({ questions: arrayMove(exam.questions, oldIdx, newIdx) })
  }

  function addQuestion(type: QuestionType) {
    if (!exam) return
    const q = createQuestion(type, exam.defaultPoints)
    update({ questions: [...exam.questions, q] })
    setShowAddMenu(false)
  }

  function updateQuestion(id: string, q: Question) {
    if (!exam) return
    update({ questions: exam.questions.map(old => old.id === id ? q : old) })
  }

  function deleteQuestion(id: string) {
    if (!exam) return
    update({ questions: exam.questions.filter(q => q.id !== id) })
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const imported = JSON.parse(ev.target?.result as string) as Exam
        saveExam(imported)
        navigate(`/editor/${imported.id}`, { replace: true })
        setExam(imported)
      } catch {
        alert('Ошибка импорта файла')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  if (!exam) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#111' }}>
        <span style={{ color: '#555', fontFamily: "'PT Mono', monospace" }}>Загрузка...</span>
      </div>
    )
  }

  const autoSubjectAbbr = getSubjectAbbr(exam.subject)
  const autoVariant = getNextVariant(exams.filter(e => e.id !== exam.id), exam.subject) + 1
  const autoId = generateExamId(exam.year, exam.subjectAbbr, exam.variant)

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#111' }}>
      {/* LEFT PANEL */}
      <div style={{
        width: 380,
        minWidth: 340,
        background: '#111111',
        borderRight: '1px solid #2a2a2a',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Top nav */}
        <div style={{ background: '#0d0d0d', borderBottom: '1px solid #2a2a2a', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => navigate('/')}
            style={{ color: '#555', fontFamily: "'PT Mono', monospace", fontSize: 12, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ← ПАК
          </button>
          <span style={{ color: '#333' }}>|</span>
          <span style={{ fontFamily: "'PT Mono', monospace", fontSize: 11, color: '#666', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {exam.id}
          </span>
          <button
            onClick={() => exportExam(exam)}
            style={{ color: '#555', fontFamily: "'PT Serif', serif", fontSize: 12, background: 'none', border: '1px solid #333', cursor: 'pointer', padding: '3px 8px' }}
            className="hover:text-white"
          >
            Экспорт
          </button>
          <label
            style={{ color: '#555', fontFamily: "'PT Serif', serif", fontSize: 12, border: '1px solid #333', cursor: 'pointer', padding: '3px 8px' }}
            className="hover:text-white"
          >
            Импорт
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>
        </div>

        <div className="flex-1 p-4 space-y-5">
          {/* Exam metadata */}
          <section>
            <h3 style={{ fontFamily: "'PT Mono', monospace", fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
              Сведения об экзамене
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Название</label>
                <input
                  value={exam.title}
                  onChange={e => update({ title: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-gray-500"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1">Учреждение</label>
                <input
                  value={exam.institution}
                  onChange={e => {
                    update({ institution: e.target.value })
                  }}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-gray-500"
                />
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 block mb-1">Код учреждения</label>
                  <input
                    value={exam.institutionCode}
                    onChange={e => {
                      saveLastInstitutionCode(e.target.value)
                      update({ institutionCode: e.target.value })
                    }}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none font-mono"
                    style={{ fontFamily: "'PT Mono', monospace" }}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500 block mb-1">Год</label>
                  <input
                    type="number"
                    value={exam.year}
                    onChange={e => update({ year: Number(e.target.value) })}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none font-mono"
                    style={{ fontFamily: "'PT Mono', monospace" }}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 block mb-1">Предмет</label>
                  <input
                    value={exam.subject}
                    onChange={e => {
                      const subject = e.target.value
                      const subjectAbbr = getSubjectAbbr(subject)
                      const variant = getNextVariant(exams.filter(ex => ex.id !== exam.id), subject) + 1
                      update({
                        subject,
                        subjectAbbr,
                        variant,
                        id: generateExamId(exam.year, subjectAbbr, variant),
                      })
                    }}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none"
                  />
                </div>
                <div style={{ width: 80 }}>
                  <SmartField
                    label="Аббр."
                    value={exam.subjectAbbr}
                    autoValue={autoSubjectAbbr}
                    onSave={v => update({
                      subjectAbbr: v,
                      id: generateExamId(exam.year, v, exam.variant),
                    })}
                    onReset={() => update({
                      subjectAbbr: autoSubjectAbbr,
                      id: generateExamId(exam.year, autoSubjectAbbr, exam.variant),
                    })}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <SmartField
                    label="Вариант"
                    value={String(exam.variant)}
                    autoValue={String(autoVariant)}
                    onSave={v => update({
                      variant: Number(v),
                      id: generateExamId(exam.year, exam.subjectAbbr, Number(v)),
                    })}
                    onReset={() => update({
                      variant: autoVariant,
                      id: generateExamId(exam.year, exam.subjectAbbr, autoVariant),
                    })}
                    type="number"
                  />
                </div>
                <div className="flex-1">
                  <SmartField
                    label="Код экзамена"
                    value={exam.id}
                    autoValue={autoId}
                    onSave={v => update({ id: v })}
                    onReset={() => update({ id: autoId })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1">Автор / Составитель</label>
                <input
                  value={exam.author}
                  onChange={e => update({ author: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none"
                />
              </div>
            </div>
          </section>

          {/* Settings */}
          <section>
            <h3 style={{ fontFamily: "'PT Mono', monospace", fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
              Параметры
            </h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 block mb-1">Лимит времени (мин)</label>
                  <input
                    type="number"
                    min={0}
                    value={exam.timeLimit ?? ''}
                    onChange={e => update({ timeLimit: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="Без лимита"
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500 block mb-1">Баллов по умолч.</label>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={exam.defaultPoints}
                    onChange={e => update({ defaultPoints: Number(e.target.value) })}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exam.shuffleQuestions}
                  onChange={e => update({ shuffleQuestions: e.target.checked })}
                  className="accent-gray-400"
                />
                <span className="text-sm text-gray-400">Перемешать вопросы</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exam.shuffleOptions}
                  onChange={e => update({ shuffleOptions: e.target.checked })}
                  className="accent-gray-400"
                />
                <span className="text-sm text-gray-400">Перемешать варианты ответов</span>
              </label>
            </div>
          </section>

          {/* Questions section */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 style={{ fontFamily: "'PT Mono', monospace", fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Вопросы ({exam.questions.length})
              </h3>
              <div className="relative">
                <button
                  onClick={() => setShowAddMenu(v => !v)}
                  style={{ fontFamily: "'PT Serif', serif", fontSize: 12, background: '#222', border: '1px solid #444', color: '#ccc', padding: '4px 12px', cursor: 'pointer' }}
                  className="hover:bg-gray-700"
                >
                  + Добавить вопрос
                </button>
                {showAddMenu && (
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: '100%',
                    marginTop: 2,
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    zIndex: 50,
                    minWidth: 220,
                  }}>
                    {(Object.keys(QUESTION_TYPE_LABELS) as QuestionType[]).map(type => (
                      <button
                        key={type}
                        onClick={() => addQuestion(type)}
                        style={{
                          display: 'block',
                          width: '100%',
                          textAlign: 'left',
                          padding: '8px 12px',
                          background: 'none',
                          border: 'none',
                          color: '#ccc',
                          fontFamily: "'PT Serif', serif",
                          fontSize: 12,
                          cursor: 'pointer',
                          borderBottom: '1px solid #222',
                        }}
                        className="hover:bg-gray-800"
                      >
                        {QUESTION_TYPE_LABELS[type]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={exam.questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {exam.questions.map((q, i) => (
                    <QuestionEditor
                      key={q.id}
                      question={q}
                      index={i}
                      onChange={updated => updateQuestion(q.id, updated)}
                      onDelete={() => deleteQuestion(q.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {exam.questions.length === 0 && (
              <div style={{ color: '#444', fontFamily: "'PT Serif', serif", fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
                Добавьте первый вопрос
              </div>
            )}
          </section>
        </div>

        {/* Bottom actions */}
        <div style={{ borderTop: '1px solid #2a2a2a', padding: '12px 16px', display: 'flex', gap: 8 }}>
          <button
            onClick={() => navigate(`/exam/${exam.id}`)}
            style={{ flex: 1, background: '#f5f5f0', color: '#0a0a0a', border: 'none', padding: '8px', fontFamily: "'PT Serif', serif", fontSize: 13, cursor: 'pointer' }}
          >
            Сдать экзамен
          </button>
          <button
            onClick={() => navigate(`/print/${exam.id}`)}
            style={{ flex: 1, background: 'transparent', color: '#888', border: '1px solid #444', padding: '8px', fontFamily: "'PT Serif', serif", fontSize: 13, cursor: 'pointer' }}
            className="hover:text-white"
          >
            Печать / PDF
          </button>
        </div>
      </div>

      {/* RIGHT PANEL — A4 Preview */}
      <div style={{ flex: 1, background: '#2a2a2a', overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 16px', gap: 8 }}>
        <div style={{ fontFamily: "'PT Mono', monospace", fontSize: 10, color: '#555', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Предварительный просмотр · A4
        </div>
        <div style={{ boxShadow: '0 4px 32px rgba(0,0,0,0.5)' }}>
          <PrintDocument exam={exam} />
        </div>
      </div>
    </div>
  )
}
