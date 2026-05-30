import { v4 as uuidv4 } from 'uuid'
import type { Exam, Question, ExamSession, Answer } from '../types'

export const SUBJECT_ABBR: Record<string, string> = {
  'физика': 'ФИЗ',
  'математика': 'МАТ',
  'русский язык': 'РУС',
  'химия': 'ХИМ',
  'биология': 'БИО',
  'история': 'ИСТ',
  'география': 'ГЕО',
  'обществознание': 'ОБЩ',
  'английский язык': 'АНГ',
  'информатика': 'ИНФ',
  'литература': 'ЛИТ',
  'навигация': 'НАВ',
}

export function getSubjectAbbr(subject: string): string {
  const key = subject.toLowerCase().trim()
  return SUBJECT_ABBR[key] ?? subject.slice(0, 3).toUpperCase()
}

export function getNextVariant(exams: Exam[], subject: string): number {
  const abbr = getSubjectAbbr(subject)
  const same = exams.filter(e => e.subjectAbbr === abbr)
  return same.length + 1
}

export function generateExamId(year: number, subjectAbbr: string, variant: number): string {
  return `ПАК-${year}-${subjectAbbr}-${String(variant).padStart(2, '0')}`
}

export function generateParticipantId(institutionCode: string, year: number): string {
  const raw = localStorage.getItem('pak_participant_counter')
  const counter = raw ? parseInt(raw, 10) + 1 : 1
  localStorage.setItem('pak_participant_counter', String(counter))
  return `${institutionCode}-${year}-${String(counter).padStart(5, '0')}`
}

export function generateSessionCode(participantId: string, examId: string): string {
  return `${participantId}-${examId}-${Date.now()}`
}

export function getLastInstitutionCode(): string {
  return localStorage.getItem('pak_last_institution') ?? 'НХД'
}

export function saveLastInstitutionCode(code: string): void {
  localStorage.setItem('pak_last_institution', code)
}

// Exam storage
const EXAMS_KEY = 'pak_exams'
const SESSIONS_KEY = 'pak_sessions'

export function loadExams(): Exam[] {
  try {
    const raw = localStorage.getItem(EXAMS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveExams(exams: Exam[]): void {
  localStorage.setItem(EXAMS_KEY, JSON.stringify(exams))
}

export function loadSessions(): ExamSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveSessions(sessions: ExamSession[]): void {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
}

export function createNewExam(exams: Exam[]): Exam {
  const year = new Date().getFullYear()
  const subject = 'Физика'
  const subjectAbbr = getSubjectAbbr(subject)
  const variant = getNextVariant(exams, subject)
  const institutionCode = getLastInstitutionCode()

  return {
    id: generateExamId(year, subjectAbbr, variant),
    title: 'Экзаменационный билет',
    subject,
    subjectAbbr,
    institutionCode,
    institution: 'МГУ им. Невельского',
    author: '',
    variant,
    year,
    createdAt: new Date().toISOString(),
    shuffleQuestions: false,
    shuffleOptions: false,
    defaultPoints: 1,
    questions: [],
  }
}

export function createQuestion(type: Question['type'], defaultPoints: number): Question {
  const base = { id: uuidv4(), text: '', points: defaultPoints, image: undefined }
  switch (type) {
    case 'single':
      return { ...base, type: 'single', options: ['', '', '', ''], correct: 0 }
    case 'multi':
      return { ...base, type: 'multi', options: ['', '', '', ''], correct: [] }
    case 'open':
      return { ...base, type: 'open', answer: '' }
    case 'match':
      return { ...base, type: 'match', pairs: [{ left: '', right: '' }, { left: '', right: '' }] }
    case 'fillblank':
      return { ...base, type: 'fillblank', template: 'Заполните пропуск: ___ и ___.', answers: ['', ''] }
  }
}

export function computeScore(exam: Exam, answers: Record<string, Answer>): { score: number; maxScore: number } {
  let score = 0
  let maxScore = 0

  for (const q of exam.questions) {
    maxScore += q.points
    const answer = answers[q.id]
    if (!answer) continue

    if (q.type === 'single' && answer.type === 'single') {
      if (answer.value === q.correct) score += q.points
    } else if (q.type === 'multi' && answer.type === 'multi') {
      const correct = [...q.correct].sort()
      const given = [...answer.value].sort()
      if (JSON.stringify(correct) === JSON.stringify(given)) score += q.points
    } else if (q.type === 'open' && answer.type === 'open') {
      if (q.answer && answer.value.trim().toLowerCase() === q.answer.trim().toLowerCase()) {
        score += q.points
      }
    } else if (q.type === 'match' && answer.type === 'match') {
      let allCorrect = true
      for (let i = 0; i < q.pairs.length; i++) {
        if (answer.value[i] !== i) { allCorrect = false; break }
      }
      if (allCorrect) score += q.points
    } else if (q.type === 'fillblank' && answer.type === 'fillblank') {
      const allCorrect = q.answers.every((a, i) =>
        answer.value[i]?.trim().toLowerCase() === a.trim().toLowerCase()
      )
      if (allCorrect) score += q.points
    }
  }

  return { score, maxScore }
}

export function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function exportExam(exam: Exam): void {
  const json = JSON.stringify(exam, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${exam.id}.pak.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export const QUESTION_TYPE_LABELS: Record<string, string> = {
  single: 'Один правильный ответ',
  multi: 'Несколько правильных ответов',
  open: 'Открытый ответ',
  match: 'Соответствие',
  fillblank: 'Заполнить пропуск',
}
