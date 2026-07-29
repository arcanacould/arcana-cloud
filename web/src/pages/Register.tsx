import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useI18n } from '../lib/i18n'

export default function Register() {
  const { t } = useI18n()
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, nombre, rol: 'tarotista' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al registrarse')

      setSuccess(t('register.success'))
    } catch (err: any) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl">🔮</h1>
          <h2 className="text-2xl font-bold text-gray-800 mt-2">{t('register.title')}</h2>
          <p className="text-gray-500 text-sm mt-1">{t('register.subtitle')}</p>
        </div>

        {success ? (
          <div className="text-center">
            <p className="text-green-600 mb-4">{success}</p>
            <button onClick={() => navigate('/login')}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >{t('register.goToLogin')}</button>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('register.name')}</label>
              <input type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder={t('register.placeholderName')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('register.email')}</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder={t('register.placeholderEmail')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('register.password')}</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder={t('register.placeholderPassword')} minLength={6}
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >{loading ? t('register.registering') : t('register.register')}</button>
          </form>
        )}

        <p className="text-center text-gray-500 text-sm mt-6">
          {t('register.hasAccount')}{' '}
          <button onClick={() => navigate('/login')} className="text-indigo-600 hover:text-indigo-800 font-medium">{t('register.login')}</button>
        </p>
      </div>
    </div>
  )
}
