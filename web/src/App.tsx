import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Layout from './components/Layout'
import { I18nProvider } from './lib/i18n'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Chat from './pages/Chat'
import Cartas from './pages/Cartas'
import CartaDetail from './pages/CartaDetail'
import Admin from './pages/Admin'
import PerfilIA from './pages/PerfilIA'
import Configuracion from './pages/Configuracion'
import Landing from './pages/Landing'
import Marketplace from './pages/Marketplace'
import Notificaciones from './pages/Notificaciones'
import Pagos from './pages/Pagos'
import Sesiones from './pages/Sesiones'
import SesionDetail from './pages/SesionDetail'
import SesionReport from './pages/SesionReport'
import Consultantes from './pages/Consultantes'

export default function App() {
  const [session, setSession] = useState<boolean | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(!!data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(!!s))
    return () => listener?.subscription.unsubscribe()
  }, [])

  return (
    <I18nProvider>
      {session === null ? (
        <div className="h-screen flex items-center justify-center text-lg text-indigo-600">Cargando...</div>
      ) : !session ? (
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Landing />} />
        </Routes>
      ) : (
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/login" element={<Navigate to="/" />} />
            <Route path="/register" element={<Navigate to="/" />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/cartas" element={<Cartas />} />
            <Route path="/cartas/:nombre" element={<CartaDetail />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/perfil-ia" element={<PerfilIA />} />
            <Route path="/configuracion" element={<Configuracion />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/notificaciones" element={<Notificaciones />} />
            <Route path="/pagos" element={<Pagos />} />
            <Route path="/sesiones" element={<Sesiones />} />
            <Route path="/sesiones/:id" element={<SesionDetail />} />
            <Route path="/sesiones/:id/reporte" element={<SesionReport />} />
            <Route path="/consultantes" element={<Consultantes />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Layout>
      )}
    </I18nProvider>
  )
}
