# Deploy init-tags Edge Function

La función `init-tags` necesita ser desplegada a Supabase antes de poder usarla.

## Opción 1: Deploy via Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref xxoacjqgvpqunxeewvsz

# Deploy the init-tags function
supabase functions deploy init-tags
```

## Opción 2: Deploy via Dashboard

1. Ir a https://supabase.com/dashboard/project/xxoacjqgvpqunxeewvsz/functions
2. Click "Create a new function"
3. Name: `init-tags`
4. Copy/paste el contenido de `supabase/functions/init-tags/index.ts`
5. Click "Deploy function"

## Verificar el deployment

```bash
# Test the function
curl -X POST https://xxoacjqgvpqunxeewvsz.supabase.co/functions/v1/init-tags \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## Troubleshooting

Si recibes error CORS:
- Verifica que los headers CORS están en `_shared/utils.ts`
- Asegúrate de que la función esté usando `handleCors()` del shared utils

Si recibes 404:
- La función no está desplegada todavía
- Verifica el nombre de la función en el dashboard
