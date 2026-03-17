// apps/api-server/src/app.js
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import { pool } from './config/db.js'

// ROTAS PÚBLICAS
import authRoutes from './routes/auth.routes.js'
import healthRoutes from './routes/health.routes.js'

// ROTAS PROTEGIDAS (com auth + RBAC)
import managerRoutes from './routes/manager.routes.js'
import consentsRoutes from './routes/consents.routes.js'
import patientsRoutes from './routes/patients.routes.js'
import documentTemplatesRoutes from './routes/document-templates.routes.js'  // ✅ NOVO

const app = express()
const PORT = process.env.PORT || 3001

// ========== MIDDLEWARES DE SEGURANÇA ==========
app.use(helmet())  // Headers de segurança
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}))

// Rate limiting - proteção DoS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por IP
  message: 'Muitas requisições, tente novamente mais tarde.'
})
app.use('/api/', limiter)

// Logging estruturado
app.use(morgan('combined'))

// ========== PARSERS ==========
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Health check básico
app.get('/health/live', (req, res) => res.status(200).json({ status: 'OK' }))

// ========== ROTAS PÚBLICAS ==========
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/health', healthRoutes)

// ========== ROTAS PROTEGIDAS ==========
app.use('/api/v1/manager', managerRoutes)
app.use('/api/v1/consents', consentsRoutes)
app.use('/api/v1/patients', patientsRoutes)
app.use('/api/v1/document-templates', documentTemplatesRoutes)  // ✅ NOVO!

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint não encontrado' })
})

// Error handler global
app.use((err, req, res, next) => {
  console.error('Erro global:', err)
  res.status(500).json({ error: 'Erro interno do servidor' })
})

// ========== GRACEFUL SHUTDOWN ==========
process.on('SIGTERM', async () => {
  console.log('SIGTERM recebido, fechando conexões...')
  await pool.end()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('SIGINT recebido, fechando conexões...')
  await pool.end()
  process.exit(0)
})

app.listen(PORT, () => {
  console.log(`🚀 Nexus API Server rodando em http://localhost:${PORT}`)
  console.log(`📋 Health: http://localhost:${PORT}/api/v1/health/live`)
})
