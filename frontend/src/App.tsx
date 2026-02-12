import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { Categories } from './pages/Categories';
import { Tags } from './pages/Tags';
import { Analytics } from './pages/Analytics';
import { Sync } from './pages/Sync';
import { useAppStore } from './store/appStore';
import './styles/globals.css';
import './styles/pages.css';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/products': 'Productos',
  '/categories': 'Categorías',
  '/tags': 'Tags',
  '/analytics': 'Análisis',
  '/sync': 'Sincronización',
};

function AppContent() {
  const location = useLocation();
  const { loading } = useAppStore();
  const pageTitle = pageTitles[location.pathname] || 'Dashboard';

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleSyncFromOdoo = async () => {
    alert('Sincronización desde Odoo (próximamente)');
  };

  const handleSyncToOdoo = async () => {
    alert('Sincronización a Odoo (próximamente)');
  };

  return (
    <div className="app-container">
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <div className="loading-text">Cargando datos...</div>
        </div>
      )}

      <Sidebar />

      <div className="main-content">
        <Header
          title={pageTitle}
          onRefresh={handleRefresh}
          onSyncFromOdoo={handleSyncFromOdoo}
          onSyncToOdoo={handleSyncToOdoo}
          showSyncButtons={location.pathname === '/' || location.pathname === '/sync'}
        />

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/tags" element={<Tags />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/sync" element={<Sync />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
