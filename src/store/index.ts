import { create } from 'zustand'
import type { Exam, ExamSession } from '../types'
import { loadExams, saveExams, loadSessions, saveSessions } from '../utils'

interface ExamStore {
  exams: Exam[]
  sessions: ExamSession[]
  loadAll: () => void
  saveExam: (exam: Exam) => void
  deleteExam: (id: string) => void
  getExam: (id: string) => Exam | undefined
  saveSession: (session: ExamSession) => void
  getSession: (sessionCode: string) => ExamSession | undefined
}

export const useExamStore = create<ExamStore>((set, get) => ({
  exams: [],
  sessions: [],

  loadAll: () => {
    set({ exams: loadExams(), sessions: loadSessions() })
  },

  saveExam: (exam) => {
    const exams = get().exams
    const idx = exams.findIndex(e => e.id === exam.id)
    const next = idx >= 0
      ? exams.map(e => e.id === exam.id ? exam : e)
      : [...exams, exam]
    saveExams(next)
    set({ exams: next })
  },

  deleteExam: (id) => {
    const next = get().exams.filter(e => e.id !== id)
    saveExams(next)
    set({ exams: next })
  },

  getExam: (id) => get().exams.find(e => e.id === id),

  saveSession: (session) => {
    const sessions = get().sessions
    const idx = sessions.findIndex(s => s.sessionCode === session.sessionCode)
    const next = idx >= 0
      ? sessions.map(s => s.sessionCode === session.sessionCode ? session : s)
      : [...sessions, session]
    saveSessions(next)
    set({ sessions: next })
  },

  getSession: (sessionCode) => get().sessions.find(s => s.sessionCode === sessionCode),
}))
