import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Navbar from './components/Navbar/Navbar'
import AuthGuard from './components/AuthGuard'

function App() {
  return (
    <main className="flex flex-col">
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<AuthGuard><Home /></AuthGuard>} />

        {/* route admin ex: */}
        {/* <Route path="/admin" element={<AuthGuard adminOnly><Admin /></AuthGuard>} /> */}
      </Routes>
    </main>
  )
}

export default App
