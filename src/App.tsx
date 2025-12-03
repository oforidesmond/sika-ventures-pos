import React, { useState, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import SalesScreen from './components/SalesScreen';
import ReceiptPreview from './components/ReceiptPreview';
import SalesHistory from './components/SalesHistory';
import ProductsSync from './components/ProductsSync';
import SettingsScreen from './components/SettingsScreen';
import Navigation from './components/Navigation';

export type Screen = 'login' | 'sales' | 'receipt' | 'history' | 'sync' | 'settings';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export type PaymentMethod = 'Cash' | 'Mobile Money' | 'Card' | 'Transfer';

export interface Sale {
  id: string;
  date: string;
  time: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  customerName?: string;
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentSale, setCurrentSale] = useState<Sale | null>(null);
  const [salesHistory, setSalesHistory] = useState<Sale[]>([]);

  // Check for existing auth token on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsLoggedIn(true);
      setCurrentScreen('sales');
    }
  }, []);

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

  const handleCompleteSale = (sale: Sale) => {
    setCurrentSale(sale);
    setSalesHistory([sale, ...salesHistory]);
    setCart([]);
    setCurrentScreen('receipt');
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
          <ProductsSync />
        )}
        {currentScreen === 'settings' && (
          <SettingsScreen />
        )}
      </div>
    </div>
  );
}
