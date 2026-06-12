import { Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'

// Router (permet de gérer les différentes pages)
function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </>
  )
}

export default App
