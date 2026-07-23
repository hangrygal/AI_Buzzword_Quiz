import { Routes, Route } from 'react-router-dom'
import Play from './pages/Play.jsx'
import Host from './pages/Host.jsx'

// Routes:
//   /       -> speler (mobile-first). ?pin=XXXXXX vult de PIN vast in (via QR).
//   /host   -> hostscherm voor de beamer.
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Play />} />
      <Route path="/host" element={<Host />} />
      <Route path="*" element={<Play />} />
    </Routes>
  )
}
