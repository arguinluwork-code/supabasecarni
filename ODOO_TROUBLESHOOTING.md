# 🔧 Troubleshooting: Error 404 con Odoo

## 📋 Diagnóstico del Problema

Cuando ves este error:
```
"Error de autenticación: HTTP 404: <!DOCTYPE html>..."
```

Significa que:
- ✅ Supabase Edge Function funciona correctamente
- ✅ La conexión a Odoo se está intentando
- ❌ **El endpoint `/jsonrpc` no está disponible en tu URL de Odoo**

---

## 🔍 Paso 1: Verificar la URL de Odoo

### En Odoo Online (odoo.com)

Si tu Odoo está en la nube (odoo.com), la URL podría tener diferentes formatos:

**Formato SaaS nuevo (Odoo 17+):**
- ✅ `https://nombre-empresa.odoo.com`
- ❌ NO incluyas `/jsonrpc` en la URL base

**Formato SaaS antiguo:**
- `https://www.odoo.com/saas_worker/...`

**Formato On-Premise:**
- `https://tu-servidor.com:8069`

### Cómo verificar tu URL correcta:

1. Inicia sesión en Odoo desde tu navegador
2. Mira la URL en la barra de direcciones
3. Usa solo la **parte base** (dominio + puerto si aplica)

**Ejemplo:**
```
URL en navegador: https://sgb-carnes2.odoo.com/web#home
URL para config:  https://sgb-carnes2.odoo.com
```

---

## 🧪 Paso 2: Testear Conexión Directa

### Opción A: Con script bash (Linux/Mac/Windows Git Bash)

```bash
cd /home/user/supabasecarni

# Editar el script primero
nano test-odoo-direct.sh

# Modificar estas líneas:
ODOO_URL="https://sgb-carnes2.odoo.com"
ODOO_DB="sgb-carnes2"
ODOO_USER="tu-email@gmail.com"
ODOO_API_KEY="tu-api-key"

# Ejecutar
./test-odoo-direct.sh
```

### Opción B: Con Node.js

```bash
# Editar el archivo
nano test-odoo-connection.js

# Modificar el objeto config:
const config = {
  url: 'https://sgb-carnes2.odoo.com',
  db: 'sgb-carnes2',
  username: 'tu-email@gmail.com',
  apiKey: 'tu-api-key'
};

# Ejecutar
node test-odoo-connection.js
```

### Opción C: Curl directo (Windows PowerShell)

```powershell
$body = @{
    jsonrpc = "2.0"
    method = "call"
    params = @{
        service = "common"
        method = "authenticate"
        args = @("sgb-carnes2", "tu-email@gmail.com", "tu-api-key", @{})
    }
    id = 1
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://sgb-carnes2.odoo.com/jsonrpc" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

---

## 🔑 Paso 3: Verificar API Key

### Cómo obtener/regenerar tu API Key:

1. Inicia sesión en Odoo
2. Click en tu nombre (arriba derecha) → **Mi Perfil**
3. Tab **Preferencias**
4. Sección **API Keys** → **Nueva API Key**
5. Ingresa tu password para confirmar
6. Copia la API key generada

⚠️ **IMPORTANTE**:
- La API key es como una contraseña
- Solo se muestra una vez
- Si la pierdes, debes generar una nueva

---

## 🐛 Problemas Comunes

### Problema 1: "404 Not Found" con página HTML de Odoo

**Causa**: El endpoint `/jsonrpc` no está disponible en tu instalación de Odoo.

**Soluciones:**

**A) Odoo Online (odoo.com) con restricciones:**
Algunas suscripciones de Odoo Online restringen el acceso a la API. Verifica:
- Menú **Configuración** → **General Settings**
- Busca "API Access" o "External API"
- Asegúrate de que esté **habilitado**

**B) Odoo version < 12:**
En versiones antiguas, el endpoint podría ser diferente:
```
/xmlrpc/2/common
/xmlrpc/2/object
```

**C) Odoo con autenticación de dos factores:**
Si tienes 2FA habilitado, la API key podría no funcionar. Prueba:
- Deshabilitar 2FA temporalmente
- O usar un usuario técnico sin 2FA para la API

---

### Problema 2: "Authentication failed"

**Causa**: Credenciales incorrectas.

**Verificar:**
```sql
-- En Supabase SQL Editor
SELECT * FROM config WHERE key LIKE 'odoo%';
```

Debe mostrar:
- `odoo_url`: URL correcta (sin /jsonrpc al final)
- `odoo_db`: Nombre exacto de la base de datos
- `odoo_username`: Email con el que inicias sesión
- `odoo_api_key`: API key válida (no la contraseña)

---

### Problema 3: CORS errors

Si ves errores de CORS al testear desde el navegador:
- ✅ Las Edge Functions de Supabase **SÍ funcionan** (servidor a servidor)
- ❌ Testing directo desde navegador **NO funciona** (CORS)

---

## ✅ Solución: Actualizar Config en Supabase

Una vez que hayas verificado las credenciales correctas:

```sql
-- Actualizar en Supabase SQL Editor
UPDATE config SET value = 'https://sgb-carnes2.odoo.com' WHERE key = 'odoo_url';
UPDATE config SET value = 'sgb-carnes2' WHERE key = 'odoo_db';
UPDATE config SET value = 'tu-email@gmail.com' WHERE key = 'odoo_username';
UPDATE config SET value = 'tu-api-key-completa' WHERE key = 'odoo_api_key';
```

Luego, volver a testear:

```bash
curl -X POST https://xxoacjqgvpqunxeewvsz.supabase.co/functions/v1/odoo-test-connection -H "Authorization: Bearer TU-SERVICE-ROLE-KEY"
```

---

## 📞 Contacto con Soporte de Odoo

Si después de todos estos pasos aún no funciona, podría ser un problema de configuración en Odoo:

1. **Odoo Online Support**:
   - https://www.odoo.com/help
   - Pregunta: "How do I enable JSON-RPC API access for my database?"

2. **Verificar plan de suscripción**:
   - Algunos planes básicos podrían no incluir acceso a API
   - Verifica en tu cuenta de Odoo

3. **Documentación oficial**:
   - https://www.odoo.com/documentation/19.0/developer/api/external_api.html

---

## 🎯 Checklist de Diagnóstico

- [ ] URL de Odoo es correcta (sin /jsonrpc al final)
- [ ] Base de datos es correcta (nombre exacto)
- [ ] Username es el email con el que inicias sesión
- [ ] API Key es válida (generada recientemente)
- [ ] API Access está habilitado en Odoo
- [ ] No hay 2FA en el usuario de API
- [ ] El endpoint /jsonrpc responde (testear con curl/scripts)
- [ ] La configuración en Supabase está actualizada

---

## 🆘 Última Opción: Usuario de Prueba

Si no logras que funcione con tu usuario principal:

1. Crea un **usuario técnico** en Odoo:
   - Menú **Configuración** → **Usuarios** → **Crear**
   - Email: `api@tu-empresa.com`
   - Permisos: **Administration / Settings**
   - Sin 2FA

2. Genera API key para ese usuario

3. Usa esas credenciales en la migración
