# WORK_SUMMARY — Arcana Cloud

## Project
Arcana Cloud — SaaS for tarotistas (tarot readers) with AI card interpretation, WhatsApp-like chat, CRM, Marketplace, and public registration.

## Stack
| Layer | Tech |
|-------|------|
| Backend | Express + TypeScript + Zod |
| Frontend | React 19 + Vite + Tailwind CSS 4 + Recharts + React Router 7 |
| Database | Supabase Postgres (project: ujdrheqeilszoilfyfsq.supabase.co) |
| AI Engines | Gemini 2.0 Flash (free, 429 quota exceeded), GPT-4o Mini, DeepSeek V4 Flash (5M free tokens) |

## Database — 12 Tables
`tarotista`, `consultante`, `sesion`, `tirada`, `carta`, `interpretacion`, `memoria`, `usuario`, `organizacion`, `perfil_persona`, `resumen`, `ake_carta`
- Migration 003 adds `motor_ia` + `prompt_personalizado` to `perfil_persona`, and `respuesta_ia` to `memoria.tipo` CHECK

## Backend Routes (src/routes/)

| File | Endpoints |
|------|-----------|
| `auth.ts` | POST login/register/logout, PATCH password, GET /me, DELETE /admin/tarotista/:id, PATCH /admin/tarotista/:id/password |
| `chat.ts` | POST /start, GET / (chat list), GET /:id (unified mensajes), POST /:id/mensaje, POST /:id/cerrar |
| `perfil.ts` | GET/PUT perfil_persona (advanced fields only for plan L or admin) |
| `public.ts` | POST /register (public), GET /tarotistas (marketplace, plan M+L) |
| `tirada.ts` | POST / (create), POST /interpretar |
| `sesion.ts`, `consultante.ts`, `tarotista.ts`, `stats.ts`, `ake.ts`, `seed.ts` | CRUD + stats + seed |

## AI Service (src/services/ai.ts)
- `generarRespuesta(motor, prompt)` — cascade: deepseek→gemini→openai / openai→gemini / gemini→openai
- `generarInterpretacionTirada()` — perfil + cartas con significado from `ake_carta`
- `generarChatRespuesta()` — perfil + memorias + tiradas previas + datos del consultante
- Prompt builder: NUCLEO_FIJO + perfil (tono, frases, cierre) + prompt_personalizado

## Middleware
- **requireAuth** (`auth.ts`): Bearer token → Supabase Auth → lookup `tarotista_id` from `usuario` table by email
- **checkPlanLimit** (`plan.ts`): S=50/100, M=200/500, L=unlimited

## Frontend Pages (src/pages/, 15 files)
- **Landing** — hero, features, pricing (S/M/L), FAQ accordion, testimonials, trust banner, multi-column footer, Unsplash images, language selector (es/en)
- **Login** — email/password → POST /api/auth/login
- **Register** — name/email/password → POST /api/public/register
- **Dashboard** — stat cards, 7-day sessions chart, readings by type chart, sessions per month chart, recent sessions table
- **Chat** — WhatsApp-like interface, chat list sidebar, unified mensajes array (contexto, tirada_pregunta, tirada_respuesta, ia_respuesta), card picker modal (3 cards, Celtic Cross, Yes/No), close session
- **Cartas** — Arcana Knowledge Encyclopedia with search, Major/Minor arcana, card detail page
- **PerfilIA** — persona name, tone, phrases, closing style, AI engine selector, custom prompt (advanced only for plan L/admin)
- **Admin** — create tarotista, list with delete + password change
- **Configuracion** — profile update, password change, subscription info
- **Marketplace** — public directory of plan M+L tarotistas
- **Sesiones**, **SesionDetail**, **SesionReport**, **Consultantes** — session management

## i18n (src/lib/i18n.tsx)
- `I18nProvider` + `useI18n` hook, es/en, persisted in localStorage key `arcana-lang`
- Language selector in Landing page header

## Key Details
- **memoria.tipo CHECK**: only allows ('creencia','situacion','hipotesis','rasgo','evento') — until migration 003 runs. Use 'evento' for `ia_respuesta`.
- **Gemini free key quota exceeded** (429), falls back to mock in `tirada.ts` or cascade in `ai.ts`
- **RLS disabled** in Supabase
- **"Confirm email" disabled** in Supabase Auth settings
- **DB password**: Adrijosu1213*.
- **Tarotista lookup**: requireAuth finds `tarotista_id` from `usuario.tarotista_id` by email matching the auth user

## Dev Commands
```bash
# Backend
cd backend && npm run dev

# Frontend
cd web && npm run dev
```