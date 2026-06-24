import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'   // Ta page d'accueil avec le header et les cartes
import Login from './pages/Login' // Ton formulaire de connexion propre
import Register from './pages/Register' // Ton formulaire de connexion propre

function App() {
  return (
    <Routes>
      {/* Quand l'utilisateur est sur la racine http://localhost:5173/ */}
      <Route path="/" element={<Home />} />
      
      {/* Quand l'utilisateur va sur http://localhost:5173/login */}
      <Route path="/login" element={<Login />} />

      {/* Quand l'utilisateur va sur http://localhost:5173/register */}
      <Route path="/register" element={<Register />} />
    </Routes>
  )
}

export default App