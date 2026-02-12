# 🚀 Frontend Quick Start Guide

## ✅ What's Already Done

The complete frontend is now set up with:
- ✅ Vite + React + TypeScript configuration
- ✅ Supabase client integration
- ✅ Dashboard with real-time data from Supabase
- ✅ Dark theme UI with responsive design
- ✅ TypeScript types matching your database schema

## 📦 Installation & Running

### Step 1: Pull the latest changes

```bash
cd D:\Claude\Supabase\Migracion\supabasecarni
git pull origin claude/migrate-appscript-supabase-oDxmT
```

### Step 2: Install dependencies

```bash
cd frontend
npm install
```

This will install:
- `react` and `react-dom` - React framework
- `@supabase/supabase-js` - Supabase client
- `vite` - Build tool
- TypeScript and ESLint - Development tools

### Step 3: Start the development server

```bash
npm run dev
```

Expected output:
```
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

### Step 4: Open in browser

Navigate to: **http://localhost:5173/**

## 🎯 What You Should See

The dashboard displays:

### 📊 Stats Cards (6 cards):
1. **Total Productos** - Total number of products (437)
2. **Productos Activos** - Active products count
3. **Disponibles en POS** - Products available in POS
4. **Margen Promedio** - Average margin in currency
5. **Margen Porcentual** - Average margin percentage
6. **Pendientes Sync** - Products pending synchronization

### 🛍️ Recent Products Table
- Shows the 10 most recently updated products
- Columns: Nombre, SKU, Categoría, Precio Venta, Costo, Margen, Margen %, Estado
- Color-coded margins (green = positive, red = negative)
- Sync status badges (SYNCED, PENDING, ERROR)

## 🔧 Configuration

The frontend is already configured with your Supabase credentials in `.env.local`:

```env
VITE_SUPABASE_URL=https://xxoacjqgvpqunxeewvsz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🐛 Troubleshooting

### If you see "Error al cargar datos":
1. Check browser console (F12) for detailed error messages
2. Verify `.env.local` exists in the `frontend` directory
3. Verify Supabase credentials are correct
4. Check that RLS policies allow anon access to views

### If npm install fails:
- Make sure you have Node.js 18+ installed: `node --version`
- Try clearing npm cache: `npm cache clean --force`
- Delete `node_modules` and try again

### If port 5173 is already in use:
- Change the port in `vite.config.ts`:
  ```ts
  server: {
    port: 3000,  // Change to any available port
    host: true
  }
  ```

## 📁 File Structure

```
frontend/
├── .env.local              # Supabase credentials
├── index.html              # HTML entry point
├── package.json            # Dependencies
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript config
└── src/
    ├── main.tsx            # React entry point
    ├── App.tsx             # Main dashboard component
    ├── App.css             # Styles (dark theme)
    ├── lib/
    │   └── supabase.ts     # Supabase client
    └── types/
        └── database.ts     # TypeScript interfaces
```

## 🎨 Features

### Current Features (v1.0):
- ✅ Real-time dashboard loading from Supabase
- ✅ Dashboard statistics view
- ✅ Recent products table
- ✅ Error handling with retry
- ✅ Loading states
- ✅ Dark theme UI
- ✅ Responsive design

### Coming Soon (Phase 2):
- ⏳ Full products table with search/filter
- ⏳ Inline editing (edit prices directly in table)
- ⏳ Bulk actions (update multiple products)
- ⏳ Categories management
- ⏳ Tags management
- ⏳ Real-time subscriptions (see changes live)
- ⏳ Sync buttons (trigger Odoo sync from UI)
- ⏳ Image upload to Supabase Storage
- ⏳ Analytics page with charts

## 🔄 Sync Status

The backend is fully functional:
- ✅ **odoo-sync-pull**: Successfully synced 437 products from Odoo
- ✅ **odoo-sync-push**: Ready to push changes back to Odoo
- ✅ **odoo-test-connection**: Connection verified
- ✅ **dashboard-stats**: Providing real-time statistics

## 📚 Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## ✨ Success Checklist

After running `npm run dev`, you should:
- [ ] See the dashboard load without errors
- [ ] See 6 stat cards with real numbers from your database
- [ ] See a table with 10 products
- [ ] See product names, SKUs, prices, and margins
- [ ] See color-coded margins (green/red)
- [ ] See sync status badges
- [ ] Be able to click "Recargar Datos" to refresh

If all checks pass: **✅ Frontend is working perfectly!**

## 🆘 Need Help?

- Check browser console (F12) for errors
- Check network tab to see API requests
- Verify Supabase dashboard shows data in tables
- All backend functions are deployed and working

---

**Created**: 2025-02-12
**Branch**: `claude/migrate-appscript-supabase-oDxmT`
**Status**: ✅ Ready to use
