import { Routes, Route, Navigate } from 'react-router-dom'
import { MonthProvider } from './hooks/useMonth.jsx'
import RequireAuth from './components/auth/RequireAuth.jsx'
import AppShell from './components/layout/AppShell.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Movements from './pages/Movements.jsx'
import CalendarPage from './pages/Calendar.jsx'
import Budget from './pages/Budget.jsx'
import Savings from './pages/Savings.jsx'
import Settings from './pages/Settings.jsx'
import Categories from './pages/Categories.jsx'
import ImportPage from './pages/Import.jsx'
import FeedbackPage from './pages/Feedback.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <RequireAuth>
            <MonthProvider>
              <AppShell />
            </MonthProvider>
          </RequireAuth>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/movimientos" element={<Movements />} />
        <Route path="/calendario" element={<CalendarPage />} />
        <Route path="/presupuesto" element={<Budget />} />
        <Route path="/ahorro" element={<Savings />} />
        <Route path="/ajustes" element={<Settings />} />
        <Route path="/categorias" element={<Categories />} />
        <Route path="/importar" element={<ImportPage />} />
        <Route path="/feedback" element={<FeedbackPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
