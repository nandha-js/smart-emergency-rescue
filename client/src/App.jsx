import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { SocketProvider } from './context/SocketContext.jsx'
import Navbar from './components/common/Navbar.jsx'
import VictimPage from './pages/VictimPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import ResponderPage from './pages/ResponderPage.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <SocketProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<VictimPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/responder" element={<ResponderPage />} />
        </Routes>
      </SocketProvider>
    </BrowserRouter>
  )
}
