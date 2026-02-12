## 🔑 Obtener Credenciales de Supabase

Para testear las Edge Functions necesitas dos credenciales de tu proyecto Supabase:

### 1. Project URL y API Keys

Ve al **Supabase Dashboard → Settings → API**:

```
Project URL: https://xxxxxxxxxxx.supabase.co
anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Diferencia entre las Keys

- **anon public key**: Para uso en frontend (safe to expose)
  - Respeta Row Level Security (RLS)
  - Solo puede hacer lo que las políticas RLS permiten

- **service_role key**: Para uso en backend/testing (¡NUNCA exponer!)
  - Bypasea Row Level Security
  - Acceso completo a la base de datos
  - **Úsala solo para testing local**

---

## 🧪 Testing de Edge Functions

### Opción 1: Script Interactivo (Recomendado)

```bash
# Configurar variables de entorno
export SUPABASE_URL="https://xxxxxxxxxxx.supabase.co"
export SUPABASE_ANON_KEY="eyJhbGc..."  # Usar service_role key para testing

# Ejecutar script
cd /home/user/supabasecarni
./test-functions.sh
```

El script te mostrará un menú interactivo para testear cada función.

### Opción 2: Curl Manual

**Test de conexión con Odoo:**
```bash
curl -X POST https://xxxxxxxxxxx.supabase.co/functions/v1/odoo-test-connection \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json"
```

**Sync Pull (Odoo → Supabase):**
```bash
curl -X POST https://xxxxxxxxxxx.supabase.co/functions/v1/odoo-sync-pull \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json"
```

**Dashboard Stats:**
```bash
curl -X GET https://xxxxxxxxxxx.supabase.co/functions/v1/dashboard-stats \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json"
```

### Opción 3: Supabase CLI (Desarrollo Local)

```bash
# Servir Edge Functions localmente
supabase functions serve

# En otra terminal, testear:
curl -X POST http://localhost:54321/functions/v1/odoo-test-connection \
  -H "Authorization: Bearer eyJhbGc..."
```

---

## ❌ Troubleshooting: Error 401 "Missing authorization header"

Si recibes este error:

```json
{"code":401,"message":"Missing authorization header"}
```

**Causas posibles:**

1. **Falta el header Authorization**: Asegúrate de incluir `-H "Authorization: Bearer <tu-key>"`

2. **Key inválida o expirada**: Verifica que estás usando la key correcta del Dashboard

3. **Formato incorrecto**: Debe ser `Bearer <key>`, no solo `<key>`

**Solución rápida:**

```bash
# Usar service_role key para testing (bypasea RLS)
curl -X POST https://tu-proyecto.supabase.co/functions/v1/odoo-test-connection \
  -H "Authorization: Bearer <TU-SERVICE-ROLE-KEY>" \
  -H "Content-Type: application/json"
```

⚠️ **IMPORTANTE**: Nunca uses el service_role key en producción o en código de frontend. Solo para testing local.

---

## 🔒 Configurar Autenticación en Producción

Para producción, deberías:

1. **Crear un usuario en Supabase Auth:**
   - Dashboard → Authentication → Users → Add user
   - Email: admin@example.com
   - Password: (tu password seguro)

2. **Autenticar desde el frontend:**
   ```typescript
   const { data, error } = await supabase.auth.signInWithPassword({
     email: 'admin@example.com',
     password: 'tu-password'
   })
   ```

3. **El token JWT se incluye automáticamente** en las requests de Supabase client

4. **Las Edge Functions verifican auth automáticamente** gracias al service_role key usado internamente

---
