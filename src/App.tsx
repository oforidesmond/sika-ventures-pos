import React, { useState, useEffect, useCallback } from 'react';
import LoginScreen from './components/LoginScreen';
import SalesScreen from './components/SalesScreen';
import ReceiptPreview from './components/ReceiptPreview';
import SalesHistory from './components/SalesHistory';
import ProductsSync from './components/ProductsSync';
import SettingsScreen from './components/SettingsScreen';
import Navigation from './components/Navigation';
import { CartItem, Sale } from './types/sales';
import { saveSaleOffline, getAllSales, getPendingSalesCount } from './storage/offlineSales';
import { syncPendingSales } from './utils/salesSync';

export type Screen = 'login' | 'sales' | 'receipt' | 'history' | 'sync' | 'settings';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentSale, setCurrentSale] = useState<Sale | null>(null);
  const [salesHistory, setSalesHistory] = useState<Sale[]>([]);
  const [pendingSalesCount, setPendingSalesCount] = useState(0);
  const [isSyncingSales, setIsSyncingSales] = useState(false);
  const [lastSalesSync, setLastSalesSync] = useState<string | null>(null);

  const isBrowser = typeof window !== 'undefined';

  const refreshSalesFromStorage = useCallback(async () => {
    if (!isBrowser) return;
    const sales = await getAllSales();
    setSalesHistory(sales);
    const pending = sales.filter((sale) => !sale.synced).length;
    setPendingSalesCount(pending);
  }, [isBrowser]);

  const syncSales = useCallback(async () => {
    if (!isBrowser) return;
    const pending = await getPendingSalesCount();
    if (pending === 0) {
      setPendingSalesCount(0);
      return;
    }

    setIsSyncingSales(true);
    try {
      const result = await syncPendingSales();
      if (result.synced > 0) {
        setLastSalesSync(new Date().toLocaleString());
      }
      await refreshSalesFromStorage();
    } catch (error) {
      console.error('Failed to sync sales', error);
    } finally {
      setIsSyncingSales(false);
    }
  }, [isBrowser, refreshSalesFromStorage]);

  // Check for existing auth token on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsLoggedIn(true);
      setCurrentScreen('sales');
    }
  }, []);

  useEffect(() => {
    if (!isBrowser) return;
    refreshSalesFromStorage();
  }, [isBrowser, refreshSalesFromStorage]);

  useEffect(() => {
    if (!isBrowser) return;
    const handleOnline = () => {
      syncSales();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [isBrowser, syncSales]);

  const handleLogin = () => {
    setIsLoggedIn(true);
    setCurrentScreen('sales');
  };

  const handleLogout = () => {
    // Clear auth data
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    
    setIsLoggedIn(false);
    setCurrentScreen('login');
    setCart([]);
  };

  const handleCompleteSale = async (sale: Sale) => {
    const saleRecord: Sale = { ...sale, synced: false };
    await saveSaleOffline(saleRecord);
    setCurrentSale(saleRecord);
    await refreshSalesFromStorage();
    setCart([]);
    setCurrentScreen('receipt');

    if (isBrowser && navigator.onLine) {
      syncSales();
    }
  };

  const handleBackToPOS = () => {
    setCurrentScreen('sales');
    setCurrentSale(null);
  };

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      <Navigation 
        currentScreen={currentScreen} 
        onNavigate={setCurrentScreen}
        onLogout={handleLogout}
      />
      
      <div className="flex-1 overflow-y-auto">
        {currentScreen === 'sales' && (
          <SalesScreen 
            cart={cart}
            setCart={setCart}
            onCompleteSale={handleCompleteSale}
          />
        )}
        {currentScreen === 'receipt' && currentSale && (
          <ReceiptPreview 
            sale={currentSale}
            onBackToPOS={handleBackToPOS}
          />
        )}
        {currentScreen === 'history' && (
          <SalesHistory sales={salesHistory} />
        )}
        {currentScreen === 'sync' && (
          <ProductsSync 
            pendingSales={pendingSalesCount}
            isSyncing={isSyncingSales}
            lastSync={lastSalesSync}
            onSyncSales={syncSales}
          />
        )}
        {currentScreen === 'settings' && (
          <SettingsScreen />
        )}
      </div>
    </div>
  );
}
