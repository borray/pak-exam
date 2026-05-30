export interface Exam {
  id: string
  title: string
  subject: string
  subjectAbbr: string
  institutionCode: string
  institution: string
  author: string
  variant: number
  year: number
  createdAt: string
  timeLimit?: number
  shuffleQuestions: boolean
  shuffleOptions: boolean
  defaultPoints: number
  questions: Question[]
}

export type QuestionType = 'single' | 'multi' | 'open' | 'match' | 'fillblank'

export type Question =
  | SingleQuestion
  | MultiQuestion
  | OpenQuestion
  | MatchQuestion
  | FillBlankQuestion

export interface SingleQuestion {
  id: string
  type: 'single'
  text: string
  image?: string
  points: number
  options: string[]
  correct: number
}

export interface MultiQuestion {
  id: string
  type: 'multi'
  text: string
  image?: string
  points: number
  options: string[]
  correct: number[]
}

export interface OpenQuestion {
  id: string
  type: 'open'
  text: string
  image?: string
  points: number
  answer?: string
}

export interface MatchQuestion {
  id: string
  type: 'match'
  text: string
  image?: string
  points: number
  pairs: { left: string; right: string }[]
}

export interface FillBlankQuestion {
  id: string
  type: 'fillblank'
  text: string
  image?: string
  points: number
  template: string
  answers: string[]
}

export interface Participant {
  id: string
  examId: string
  fullName?: string
  groupClass?: string
  issuedAt: string
  sessionCode: string
}

export interface ExamSession {
  sessionCode: string
  participant: Participant
  exam: Exam
  answers: Record<string, Answer>
  startedAt: string
  finishedAt?: string
  score?: number
  maxScore?: number
}

export type Answer =
  | { type: 'single'; value: number | null }
  | { type: 'multi'; value: number[] }
  | { type: 'open'; value: string }
  | { type: 'match'; value: Record<number, number> }
  | { type: 'fillblank'; value: string[] }
