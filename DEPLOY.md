# Despliegue de HabitFlow

## 1. Crear proyecto en Supabase

1. Ve a https://supabase.com y crea una cuenta gratuita
2. Crea un **New Project** (elige región cercana, ej. `eu-central-1`)
3. En el dashboard del proyecto → **SQL Editor** → pega y ejecuta el contenido de `supabase/schema.sql`
4. Ve a **Settings → API** y copia:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`
5. Ve a **Authentication → Providers** → habilita **Email** (ya viene activo)
   - Opcional: deshabilita "Confirm email" si quieres entrar de inmediato sin confirmar

## 2. Variables de entorno locales

Crea un archivo `.env.local` en la raíz del proyecto:

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Prueba localmente: `npm run dev`

## 3. Subir código a GitHub

```bash
git init
git add .
git commit -m "feat: HabitFlow v1.0"
git remote add origin https://github.com/TU_USUARIO/habitflow.git
git push -u origin main
```

## 4. Desplegar en Vercel (gratis)

1. Ve a https://vercel.com → **Add New Project** → importa el repo de GitHub
2. Framework: **Vite** (se detecta automáticamente)
3. En **Environment Variables** añade:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Click **Deploy** → en ~1 minuto tienes tu URL `https://habitflow-xxx.vercel.app`

Cada `git push` a `main` redespliega automáticamente.

## 5. Primer uso

1. Abre la URL de Vercel
2. Crea una cuenta (o usa la misma que en Supabase)
3. Si tenías datos en el navegador local → ve a **Ajustes → Migrar datos locales**

## Límites del plan gratuito

| Recurso | Límite gratuito |
|---------|----------------|
| Supabase DB | 500 MB |
| Supabase Auth | 50.000 usuarios |
| Supabase Bandwidth | 5 GB/mes |
| Vercel deploys | Ilimitados |
| Vercel bandwidth | 100 GB/mes |

Para uso personal es más que suficiente.
