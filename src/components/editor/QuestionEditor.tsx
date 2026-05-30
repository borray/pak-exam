import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Question } from '../../types'
import { QUESTION_TYPE_LABELS } from '../../utils'

interface Props {
  question: Question
  index: number
  onChange: (q: Question) => void
  onDelete: () => void
}

const LETTERS = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З']

function ImageUpload({ value, onChange }: { value?: string; onChange: (v: string | undefined) => void }) {
  return (
    <div className="mt-2">
      {value ? (
        <div className="relative inline-block">
          <img src={value} alt="" className="max-h-24 max-w-xs object-contain border border-gray-600 rounded" />
          <button
            onClick={() => onChange(undefined)}
            className="absolute top-0 right-0 bg-red-700 text-white text-xs px-1 rounded"
          >✕</button>
        </div>
      ) : (
        <label className="cursor-pointer text-xs text-gray-400 hover:text-gray-200 border border-dashed border-gray-600 px-2 py-1 rounded inline-block">
          + Изображение
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0]
              if (!file) return
              const reader = new FileReader()
              reader.onload = ev => onChange(ev.target?.result as string)
              reader.readAsDataURL(file)
            }}
          />
        </label>
      )}
    </div>
  )
}

function SingleEditor({ q, onChange }: { q: Extract<Question, { type: 'single' }>; onChange: (q: Question) => void }) {
  return (
    <div className="space-y-2">
      {q.options.map((opt, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="radio"
            checked={q.correct === i}
            onChange={() => onChange({ ...q, correct: i })}
            className="accent-green-500"
          />
          <span className="text-gray-400 text-sm w-5">{LETTERS[i]})</span>
          <input
            value={opt}
            onChange={e => {
              const options = [...q.options]
              options[i] = e.target.value
              onChange({ ...q, options })
            }}
            placeholder={`Вариант ${LETTERS[i]}`}
            className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-gray-400"
          />
          {q.options.length > 2 && (
            <button
              onClick={() => {
                const options = q.options.filter((_, j) => j !== i)
                const correct = q.correct > i ? q.correct - 1 : q.correct === i ? 0 : q.correct
                onChange({ ...q, options, correct })
              }}
              className="text-gray-500 hover:text-red-400 text-xs"
            >✕</button>
          )}
        </div>
      ))}
      {q.options.length < 8 && (
        <button
          onClick={() => onChange({ ...q, options: [...q.options, ''] })}
          className="text-xs text-gray-400 hover:text-gray-200 border border-dashed border-gray-600 px-2 py-1 rounded"
        >
          + Добавить вариант
        </button>
      )}
    </div>
  )
}

function MultiEditor({ q, onChange }: { q: Extract<Question, { type: 'multi' }>; onChange: (q: Question) => void }) {
  function toggleCorrect(i: number) {
    const correct = q.correct.includes(i) ? q.correct.filter(c => c !== i) : [...q.correct, i]
    onChange({ ...q, correct })
  }
  return (
    <div className="space-y-2">
      {q.options.map((opt, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={q.correct.includes(i)}
            onChange={() => toggleCorrect(i)}
            className="accent-green-500"
          />
          <span className="text-gray-400 text-sm w-5">{LETTERS[i]})</span>
          <input
            value={opt}
            onChange={e => {
              const options = [...q.options]
              options[i] = e.target.value
              onChange({ ...q, options })
            }}
            placeholder={`Вариант ${LETTERS[i]}`}
            className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-gray-400"
          />
          {q.options.length > 2 && (
            <button
              onClick={() => {
                const options = q.options.filter((_, j) => j !== i)
                const correct = q.correct.filter(c => c !== i).map(c => c > i ? c - 1 : c)
                onChange({ ...q, options, correct })
              }}
              className="text-gray-500 hover:text-red-400 text-xs"
            >✕</button>
          )}
        </div>
      ))}
      {q.options.length < 8 && (
        <button
          onClick={() => onChange({ ...q, options: [...q.options, ''] })}
          className="text-xs text-gray-400 hover:text-gray-200 border border-dashed border-gray-600 px-2 py-1 rounded"
        >
          + Добавить вариант
        </button>
      )}
    </div>
  )
}

function OpenEditor({ q, onChange }: { q: Extract<Question, { type: 'open' }>; onChange: (q: Question) => void }) {
  return (
    <div>
      <label className="text-xs text-gray-400 block mb-1">Правильный ответ (для автопроверки)</label>
      <input
        value={q.answer ?? ''}
        onChange={e => onChange({ ...q, answer: e.target.value })}
        placeholder="Оставьте пустым для ручной проверки"
        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-gray-400"
      />
    </div>
  )
}

function MatchEditor({ q, onChange }: { q: Extract<Question, { type: 'match' }>; onChange: (q: Question) => void }) {
  return (
    <div className="space-y-2">
      {q.pairs.map((pair, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-gray-400 text-sm w-5">{i + 1}.</span>
          <input
            value={pair.left}
            onChange={e => {
              const pairs = [...q.pairs]
              pairs[i] = { ...pairs[i], left: e.target.value }
              onChange({ ...q, pairs })
            }}
            placeholder="Левый элемент"
            className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-gray-400"
          />
          <span className="text-gray-500">↔</span>
          <input
            value={pair.right}
            onChange={e => {
              const pairs = [...q.pairs]
              pairs[i] = { ...pairs[i], right: e.target.value }
              onChange({ ...q, pairs })
            }}
            placeholder="Правый элемент"
            className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-gray-400"
          />
          {q.pairs.length > 2 && (
            <button
              onClick={() => onChange({ ...q, pairs: q.pairs.filter((_, j) => j !== i) })}
              className="text-gray-500 hover:text-red-400 text-xs"
            >✕</button>
          )}
        </div>
      ))}
      <button
        onClick={() => onChange({ ...q, pairs: [...q.pairs, { left: '', right: '' }] })}
        className="text-xs text-gray-400 hover:text-gray-200 border border-dashed border-gray-600 px-2 py-1 rounded"
      >
        + Добавить пару
      </button>
    </div>
  )
}

function FillBlankEditor({ q, onChange }: { q: Extract<Question, { type: 'fillblank' }>; onChange: (q: Question) => void }) {
  const blankCount = (q.template.match(/___/g) ?? []).length
  const answers = [...q.answers]
  while (answers.length < blankCount) answers.push('')
  while (answers.length > blankCount) answers.pop()

  return (
    <div className="space-y-2">
      <div>
        <label className="text-xs text-gray-400 block mb-1">Шаблон (используйте ___ для пропусков)</label>
        <textarea
          value={q.template}
          onChange={e => onChange({ ...q, template: e.target.value, answers })}
          rows={2}
          className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-gray-400 resize-none"
        />
      </div>
      {answers.map((ans, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">Пропуск {i + 1}:</span>
          <input
            value={ans}
            onChange={e => {
              const newAnswers = [...answers]
              newAnswers[i] = e.target.value
              onChange({ ...q, answers: newAnswers })
            }}
            placeholder={`Правильный ответ ${i + 1}`}
            className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-gray-400"
          />
        </div>
      ))}
    </div>
  )
}

export function QuestionEditor({ question, index, onChange, onDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: question.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden"
    >
      {/* Question header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-750 border-b border-gray-700">
        <button
          {...attributes}
          {...listeners}
          className="text-gray-500 hover:text-gray-300 cursor-grab active:cursor-grabbing text-sm select-none"
          title="Перетащить"
        >
          ⠿
        </button>
        <span className="text-gray-400 text-sm font-mono">{index + 1}.</span>
        <span className="text-xs text-gray-500 border border-gray-600 px-1.5 py-0.5 rounded">
          {QUESTION_TYPE_LABELS[question.type]}
        </span>
        <div className="flex-1" />
        <div className="flex items-center gap-1">
          <label className="text-xs text-gray-400">Баллы:</label>
          <input
            type="number"
            min={0}
            step={0.5}
            value={question.points}
            onChange={e => onChange({ ...question, points: Number(e.target.value) } as Question)}
            className="w-14 bg-gray-700 border border-gray-600 rounded px-1 py-0.5 text-sm text-white text-center focus:outline-none"
          />
        </div>
        <button onClick={onDelete} className="text-gray-500 hover:text-red-400 text-sm transition-colors">🗑</button>
      </div>

      {/* Question body */}
      <div className="p-3 space-y-3">
        <div>
          <label className="text-xs text-gray-400 block mb-1">Текст вопроса</label>
          <textarea
            value={question.text}
            onChange={e => onChange({ ...question, text: e.target.value } as Question)}
            rows={2}
            placeholder="Введите текст вопроса..."
            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-gray-400 resize-none"
          />
        </div>

        <ImageUpload
          value={question.image}
          onChange={v => onChange({ ...question, image: v } as Question)}
        />

        {question.type === 'single' && <SingleEditor q={question} onChange={onChange} />}
        {question.type === 'multi' && <MultiEditor q={question} onChange={onChange} />}
        {question.type === 'open' && <OpenEditor q={question} onChange={onChange} />}
        {question.type === 'match' && <MatchEditor q={question} onChange={onChange} />}
        {question.type === 'fillblank' && <FillBlankEditor q={question} onChange={onChange} />}
      </div>
    </div>
  )
}
