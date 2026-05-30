import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Home } from './pages/Home'
import { Editor } from './pages/Editor'
import { ExamTaking } from './pages/ExamTaking'
import { Results } from './pages/Results'
import { Print } from './pages/Print'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/editor/:id" element={<Editor />} />
        <Route path="/exam/:id" element={<ExamTaking />} />
        <Route path="/results/:id" element={<Results />} />
        <Route path="/print/:id" element={<Print />} />
      </Routes>
    </BrowserRouter>
  )
}
