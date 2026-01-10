import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Editor from './pages/Editor'
import Projects from './pages/Projects'
import Jobs from './pages/Jobs'
import { Toaster } from './components/ui/toaster'

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="editor" element={<Editor />} />
          <Route path="editor/:projectId" element={<Editor />} />
          <Route path="projects" element={<Projects />} />
          <Route path="jobs" element={<Jobs />} />
        </Route>
      </Routes>
      <Toaster />
    </>
  )
}

export default App
