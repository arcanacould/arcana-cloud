import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import path from 'path'
import fs from 'fs'
import { config } from './config'
import authRoutes from './routes/auth'
import tarotistaRoutes from './routes/tarotista'
import consultanteRoutes from './routes/consultante'
import sesionRoutes from './routes/sesion'
import tiradaRoutes from './routes/tirada'
import akeRoutes from './routes/ake'
import seedRoutes from './routes/seed'
import statsRoutes from './routes/stats'
import perfilRoutes from './routes/perfil'
import chatRoutes from './routes/chat'
import publicRoutes from './routes/public'
import notificacionRoutes from './routes/notificacion'
import pagoRoutes from './routes/pago'
import uploadRoutes from './routes/upload'
import valoracionRoutes from './routes/valoracion'

const app = express()

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))

const allowedOrigins = process.env.NODE_ENV === 'production'
  ? (process.env.CORS_ORIGINS || '').split(',').filter(Boolean)
  : ['http://localhost:5173', 'http://localhost:3000']
app.use(cors({ origin: allowedOrigins, credentials: true }))

app.use(rateLimit({ windowMs: 60_000, max: 100, standardHeaders: true, legacyHeaders: false }))

app.use(express.json({ limit: '5mb' }))

app.get('/health', (_req, res) => res.json({ status: 'ok', version: '0.1.0' }))

app.use('/api/auth', authRoutes)
app.use('/api/tarotistas', tarotistaRoutes)
app.use('/api/consultantes', consultanteRoutes)
app.use('/api/sesiones', sesionRoutes)
app.use('/api/tiradas', tiradaRoutes)
app.use('/api/ake', akeRoutes)
app.use('/api/seed', seedRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/perfil', perfilRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/public', publicRoutes)
app.use('/api/notificaciones', notificacionRoutes)
app.use('/api/pagos', pagoRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/valoraciones', valoracionRoutes)

const distPath = path.resolve(__dirname, '../../web/dist')
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath))
  app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')))
}

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Error]', err?.message || err)
  const status = err?.status || err?.statusCode || 500
  res.status(status).json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err?.message })
})

app.listen(config.port, () => {
  console.log(`Arcana Cloud API running on port ${config.port}`)
})

export default app
