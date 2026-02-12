# Carnicería Control - Supabase Migration

Sistema de gestión de productos para carnicería, migrado desde Google Apps Script + Sheets a Supabase (PostgreSQL + Edge Functions) + React.

## 🚀 Descripción del Proyecto

**Carnicería Control** es una aplicación completa de gestión de inventario y productos con las siguientes capacidades:

- **Gestión de productos** con precios, márgenes, categorías y tags
- **Sincronización bidireccional con Odoo 19 Enterprise** (ERP)
- **Sistema de tags multi-dimensional** (Tipo, Conservación, Departamento, Integridad, Perfil comercial)
- **Dashboard con analytics** y estadísticas en tiempo real
- **Almacenamiento de imágenes** de productos (Supabase Storage)
- **Realtime subscriptions** para actualizaciones en vivo

### Stack Tecnológico

#### Backend
- **Supabase** (PostgreSQL + Edge Functions)
- **Deno/TypeScript** para Edge Functions
- **Row Level Security (RLS)** para seguridad
- **Supabase Storage** para imágenes

#### Frontend (próximamente)
- **Vite + React + TypeScript**
- **Zustand** para state management
- **React Router** para navegación
- **Tailwind CSS** para estilos

#### Integración Externa
- **Odoo 19 Enterprise** vía JSON-RPC

---

## 📋 Requisitos Previos

- **Node.js** 18+ y npm
- **Supabase CLI** instalado: `npm install -g supabase`
- **Cuenta de Supabase** (crear en https://supabase.com)
- **Acceso a Odoo 19 Enterprise** con credenciales de API

---

## 🔧 Setup Paso a Paso

### 1. Crear Proyecto Supabase

1. Ve a https://supabase.com y crea un nuevo proyecto
2. Guarda tu **Project URL** y **Anon Key** (los necesitarás después)
3. Espera a que el proyecto se inicialice (2-3 minutos)

### 2. Clonar el Repositorio

```bash
git clone <tu-repo-url>
cd supabasecarni
```

### 3. Ejecutar Migraciones de Base de Datos

**Opción A: Desde Supabase Dashboard (Recomendado para primera vez)**

1. Ve al Supabase Dashboard → **SQL Editor**
2. Copia y pega el contenido de `supabase/migrations/20250212000000_initial_schema.sql`
3. Ejecuta el script (click en "Run")
4. Copia y pega el contenido de `supabase/migrations/20250212000001_seed_tags.sql`
5. Ejecuta el script

**Opción B: Usando Supabase CLI**

```bash
# Inicializar Supabase CLI
supabase init

# Linkear con tu proyecto
supabase link --project-ref <tu-project-ref>

# Ejecutar migraciones
supabase db push
```

### 4. Configurar Storage para Imágenes

1. Ve al Supabase Dashboard → **Storage**
2. Crea un nuevo bucket llamado `products`
3. Configúralo como **público** (para que las URLs sean accesibles)
4. (Opcional) Configura políticas de RLS si quieres restringir uploads

### 5. Configurar Credenciales de Odoo

**Opción A: Desde Supabase Dashboard**

1. Ve al **SQL Editor**
2. Ejecuta las siguientes queries para configurar tus credenciales:

```sql
UPDATE config SET value = 'https://tu-odoo-url.odoo.com' WHERE key = 'odoo_url';
UPDATE config SET value = 'tu-database-name' WHERE key = 'odoo_db';
UPDATE config SET value = 'tu-email@example.com' WHERE key = 'odoo_username';
UPDATE config SET value = 'tu-api-key-aqui' WHERE key = 'odoo_api_key';
```

⚠️ **IMPORTANTE**: La URL de Odoo debe ser **solo el dominio**, sin `/jsonrpc` al final:
- ✅ Correcto: `https://tu-empresa.odoo.com`
- ❌ Incorrecto: `https://tu-empresa.odoo.com/jsonrpc`

El OdooClient agrega `/jsonrpc` automáticamente.

**Opción B: Usando Secrets (para Edge Functions)**

```bash
supabase secrets set ODOO_URL=https://tu-odoo-url.odoo.com
supabase secrets set ODOO_DB=tu-database-name
supabase secrets set ODOO_USERNAME=tu-email@example.com
supabase secrets set ODOO_API_KEY=tu-api-key-aqui
```

> **Cómo obtener tu Odoo API Key:**
> 1. Inicia sesión en Odoo
> 2. Ve a tu perfil (arriba derecha)
> 3. Preferencias → API Keys
> 4. Genera una nueva API key

### 6. Deployar Edge Functions

```bash
# Test de conexión con Odoo
supabase functions deploy odoo-test-connection

# Sincronización desde Odoo
supabase functions deploy odoo-sync-pull

# Sincronización hacia Odoo
supabase functions deploy odoo-sync-push

# Dashboard stats
supabase functions deploy dashboard-stats
```

**Verificar deployment:**

```bash
supabase functions list
```

### 7. Testear la Integración

**Test de conexión con Odoo:**

```bash
curl -X POST https://<tu-project-ref>.supabase.co/functions/v1/odoo-test-connection \
  -H "Authorization: Bearer <tu-anon-key>"
```

**Sincronizar datos desde Odoo:**

```bash
curl -X POST https://<tu-project-ref>.supabase.co/functions/v1/odoo-sync-pull \
  -H "Authorization: Bearer <tu-anon-key>"
```

Esto puede tardar varios minutos dependiendo de la cantidad de productos en Odoo.

**Ver estadísticas del dashboard:**

```bash
curl https://<tu-project-ref>.supabase.co/functions/v1/dashboard-stats \
  -H "Authorization: Bearer <tu-anon-key>"
```

---

## 📊 Estructura de Base de Datos

El schema incluye las siguientes tablas principales:

- **products** - Productos con precios, márgenes calculados automáticamente
- **categories** - Categorías de productos (jerárquicas)
- **pos_categories** - Categorías del punto de venta
- **taxes** - Impuestos
- **tag_dimensions** - Dimensiones de tags (5 dimensiones predefinidas)
- **tags** - Tags para clasificar productos (19 tags predefinidos)
- **product_tags** - Relación many-to-many entre productos y tags
- **config** - Configuración de la aplicación y credenciales de Odoo
- **sync_log** - Log de sincronizaciones
- **pending_changes** - Auditoría de cambios pendientes

### Vistas útiles:

- **products_full** - Productos con tags concatenados como string
- **dashboard_stats** - Estadísticas pre-calculadas para el dashboard
- **tags_by_dimension** - Tags agrupados por dimensión

---

## 🔄 Sincronización con Odoo

### Pull (Odoo → Supabase)

Sincroniza **todos los datos** desde Odoo a Supabase:

```bash
# Desde la línea de comandos
curl -X POST https://<tu-project-ref>.supabase.co/functions/v1/odoo-sync-pull \
  -H "Authorization: Bearer <tu-anon-key>"
```

**Qué sincroniza:**
1. Impuestos (account.tax)
2. Categorías de productos (product.category)
3. Categorías POS (pos.category)
4. Productos (product.template) con todos sus datos:
   - Precios (list_price, standard_price)
   - Categorías y categorías POS
   - Impuestos
   - Tags (campo custom `x_tags` en Odoo)
   - Disponibilidad en POS
   - Estado activo/inactivo

**Tiempo estimado:**
- ~30 segundos para 200 productos
- ~2-3 minutos para 1000 productos

### Push (Supabase → Odoo)

Sincroniza **solo los productos modificados** desde Supabase a Odoo:

```bash
curl -X POST https://<tu-project-ref>.supabase.co/functions/v1/odoo-sync-push \
  -H "Authorization: Bearer <tu-anon-key>"
```

**Cómo funciona:**
1. Detecta productos con `modified=true`
2. Actualiza esos productos en Odoo
3. Marca productos como `modified=false` y `sync_status='SYNCED'`
4. Registra el sync en `sync_log`

**Qué campos se sincronizan:**
- Precios (list_price, standard_price)
- Categoría
- Categoría POS
- Impuestos
- Disponibilidad en POS
- Estado activo/inactivo
- Tags

---

## 🛠️ Edge Functions Disponibles

| Función | URL | Descripción |
|---------|-----|-------------|
| **odoo-test-connection** | `/functions/v1/odoo-test-connection` | Verifica conexión con Odoo |
| **odoo-sync-pull** | `/functions/v1/odoo-sync-pull` | Sincroniza desde Odoo a Supabase |
| **odoo-sync-push** | `/functions/v1/odoo-sync-push` | Sincroniza cambios a Odoo |
| **dashboard-stats** | `/functions/v1/dashboard-stats` | Obtiene estadísticas del dashboard |

---

## 🔐 Seguridad

### Row Level Security (RLS)

Todas las tablas tienen RLS habilitado. Actualmente, las políticas permiten acceso completo a usuarios autenticados:

```sql
CREATE POLICY "Allow authenticated full access" ON products
  FOR ALL USING (auth.role() = 'authenticated');
```

**Para producción**, deberías refinar las políticas según roles (admin, viewer, etc.).

### Autenticación

El proyecto usa **Supabase Auth**. Para crear usuarios:

1. Ve al Supabase Dashboard → **Authentication** → **Users**
2. Click en "Add user"
3. Ingresa email y contraseña

**Próximos pasos:** Agregar signup page en el frontend, OAuth (Google), etc.

---

## 📁 Estructura del Proyecto

```
supabasecarni/
├── supabase/
│   ├── migrations/
│   │   ├── 20250212000000_initial_schema.sql    # Schema completo
│   │   └── 20250212000001_seed_tags.sql         # Tags predefinidos
│   └── functions/
│       ├── _shared/
│       │   ├── odoo-client.ts                   # Cliente Odoo (TypeScript)
│       │   ├── database.ts                      # Helpers de DB
│       │   ├── types.ts                         # TypeScript types
│       │   └── utils.ts                         # Utilidades comunes
│       ├── odoo-sync-pull/
│       │   └── index.ts                         # Sync desde Odoo
│       ├── odoo-sync-push/
│       │   └── index.ts                         # Sync hacia Odoo
│       ├── odoo-test-connection/
│       │   └── index.ts                         # Test de conexión
│       └── dashboard-stats/
│           └── index.ts                         # Estadísticas
└── README.md
```

---

## 🎯 Próximos Pasos

### Backend (Completado ✅)
- ✅ Schema de PostgreSQL con triggers y RLS
- ✅ Tags predefinidos seeded
- ✅ OdooClient en TypeScript
- ✅ Edge Functions de sincronización (pull/push)
- ✅ Edge Function de test de conexión
- ✅ Edge Function de dashboard stats

### Frontend (Por implementar)
- [ ] Setup Vite + React + TypeScript
- [ ] Crear componentes:
  - [ ] Dashboard con estadísticas
  - [ ] ProductsTable con inline editing
  - [ ] Categories management
  - [ ] Tags management
  - [ ] Sync status y logs
- [ ] Implementar Zustand stores
- [ ] Integrar Realtime subscriptions
- [ ] Implementar upload de imágenes (Supabase Storage)
- [ ] Deploy a Vercel

### Testing
- [ ] Test sync pull completo
- [ ] Test sync push con productos modificados
- [ ] Test con > 1000 productos
- [ ] Test realtime subscriptions
- [ ] Test upload de imágenes

---

## 🐛 Troubleshooting

### "Error fetching Odoo config: Missing required Odoo config"

Asegúrate de haber configurado las credenciales de Odoo en la tabla `config`:

```sql
SELECT * FROM config WHERE key LIKE 'odoo%';
```

### "HTTP 403" al hacer push

Verifica que el branch comience con `claude/` y termine con el session ID correcto:

```bash
git branch
# Debe mostrar: claude/migrate-appscript-supabase-oDxmT
```

### "Timeout" en sync pull

Si tienes muchos productos (> 2000), considera:
1. Aumentar el timeout en la Edge Function
2. Implementar sync incremental (solo productos modificados desde última sync)

### Las estadísticas no se actualizan

Las vistas se calculan en tiempo real. Si ves datos desactualizados, verifica:

```sql
-- Recalcular contadores de categorías
SELECT recalculate_category_counts();

-- Recalcular contadores de tags
SELECT recalculate_tag_counts();
```

---

## 📝 Notas Importantes

### Tags en Odoo

El sistema asume que Odoo tiene un campo custom `x_tags` en el modelo `product.template` para almacenar tags como string comma-separated:

```
"Materia Prima, Congelado, Mostrador carnicería"
```

Si tu instalación de Odoo no tiene este campo, los tags no se sincronizarán (pero el resto funciona normal).

### Márgenes Calculados

Los campos `margin` y `margin_percent` son **columnas generadas automáticamente** en PostgreSQL:

```sql
margin = list_price - standard_price
margin_percent = ((list_price - standard_price) / standard_price) * 100
```

No necesitas calcularlos manualmente; se actualizan automáticamente cuando cambias los precios.

### Change Tracking

Los cambios se detectan automáticamente usando **database triggers**. Cuando modificas un producto, el trigger:
1. Marca `modified=true`
2. Cambia `sync_status='PENDING'`
3. Registra el cambio en `pending_changes`

---

## 📞 Contacto y Soporte

- **GitHub Issues**: Para reportar bugs o pedir features
- **Documentación de Supabase**: https://supabase.com/docs
- **Documentación de Odoo API**: https://www.odoo.com/documentation/19.0/developer/api.html

---

## 📜 Licencia

[Tu licencia aquí]

---

**¡Feliz migración! 🚀**
