import React, { useState } from 'react';
import { Search, Minus, Plus, Trash2, ShoppingBag, ChevronDown } from 'lucide-react';
import { CartItem, Sale } from '../App';

interface Product {
  id: string;
  name: string;
  price: number;
}

interface SalesScreenProps {
  cart: CartItem[];
  setCart: (cart: CartItem[]) => void;
  onCompleteSale: (sale: Sale) => void;
}

const PRODUCTS: Product[] = [
  { id: '1', name: 'Coca Cola', price: 2.50 },
  { id: '2', name: 'Pepsi', price: 2.50 },
  { id: '3', name: 'Water Bottle', price: 1.00 },
  { id: '4', name: 'Orange Juice', price: 3.50 },
  { id: '5', name: 'Coffee', price: 4.00 },
  { id: '6', name: 'Chips', price: 3.00 },
  { id: '7', name: 'Chocolate Bar', price: 2.00 },
  { id: '8', name: 'Cookies', price: 3.50 },
  { id: '9', name: 'Candy', price: 1.50 },
  { id: '10', name: 'Nuts', price: 4.50 },
  { id: '11', name: 'USB Cable', price: 8.99 },
  { id: '12', name: 'Phone Charger', price: 12.99 },
  { id: '13', name: 'Batteries AA', price: 5.99 },
  { id: '14', name: 'Earphones', price: 15.99 },
  { id: '15', name: 'Paper Towels', price: 4.99 },
  { id: '16', name: 'Dish Soap', price: 3.99 },
  { id: '17', name: 'Trash Bags', price: 6.99 },
  { id: '18', name: 'Hand Soap', price: 3.49 },
  { id: '19', name: 'Shampoo', price: 7.99 },
  { id: '20', name: 'Toothpaste', price: 4.49 },
];

type PaymentMethod = 'Cash' | 'Mobile Money' | 'Card' | 'Transfer';

export default function SalesScreen({ cart, setCart, onCompleteSale }: SalesScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [discount, setDiscount] = useState(0);
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  
  const filteredProducts = PRODUCTS.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );


  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(item =>
      item.id === id
        ? { ...item, quantity: Math.max(1, item.quantity + delta) }
        : item
    ).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal - discount;

  const handleCompleteSale = () => {
    if (cart.length === 0) return;

    const now = new Date();
    const sale: Sale = {
      id: `SALE-${Date.now()}`,
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString(),
      items: [...cart],
      subtotal,
      discount,
      total,
      paymentMethod,
    };

    onCompleteSale(sale);
  };

  const paymentMethods: PaymentMethod[] = ['Cash', 'Mobile Money', 'Card', 'Transfer'];

  const selectPaymentMethod = (method: PaymentMethod) => {
    setPaymentMethod(method);
    setShowPaymentMethods(false);
  };

  return (
    <div className="h-full flex">

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Search Bar */}
        <div className="p-6 border-b-2 border-gray-100">
          <div className="relative max-w-2xl">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-16 pr-6 py-5 border-2 border-gray-200 rounded-2xl text-lg focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <div
                key={product.id}
                className="bg-white border-2 border-gray-100 rounded-2xl p-6 hover:border-blue-500 hover:shadow-lg transition-all"
              >
                <div className="mb-4">
                  <h4 className="text-gray-800">{product.name}</h4>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-blue-600">₵{product.price.toFixed(2)}</span>
                  <button
                    onClick={() => addToCart(product)}
                    className="bg-gradient-to-r from-blue-500 to-teal-500 text-white px-5 py-3 rounded-xl hover:from-blue-600 hover:to-teal-600 transition-all shadow-md hover:shadow-lg active:scale-95"
                  >
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Sidebar - Cart */}
      <div className="w-96 bg-gray-50 border-l-2 border-gray-100 flex flex-col">
        <div className="p-6 border-b-2 border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-7 h-7 text-blue-500" strokeWidth={2.5} />
              <h3 className="text-gray-800">Cart ({cart.length})</h3>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowPaymentMethods(!showPaymentMethods)}
                className="flex items-center gap-2 bg-white border-2 border-gray-200 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {paymentMethod}
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>
              {showPaymentMethods && (
                <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1">
                    {paymentMethods.map((method) => (
                      <button
                        key={method}
                        onClick={() => selectPaymentMethod(method)}
                        className={`block w-full text-left px-4 py-2 text-sm ${
                          paymentMethod === method 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-400">Cart is empty</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map(item => (
                <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h5 className="text-gray-800 mb-1">{item.name}</h5>
                      <p className="text-blue-600">₵{item.price.toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="bg-gray-100 hover:bg-gray-200 p-2 rounded-lg transition-colors"
                    >
                      <Minus className="w-5 h-5 text-gray-600" />
                    </button>
                    <span className="text-gray-800 min-w-12 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="bg-gray-100 hover:bg-gray-200 p-2 rounded-lg transition-colors"
                    >
                      <Plus className="w-5 h-5 text-gray-600" />
                    </button>
                    <span className="ml-auto text-gray-800">
                      ₵{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Summary */}
        <div className="border-t-2 border-gray-100 p-6 space-y-4">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal:</span>
            <span>₵{subtotal.toFixed(2)}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Discount:</span>
            <input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-24 px-3 py-2 border-2 border-gray-200 rounded-lg text-right focus:outline-none focus:border-blue-500"
              placeholder="0.00"
              step="0.01"
            />
          </div>

          <div className="flex justify-between pt-4 border-t-2 border-gray-200">
            <span>Total:</span>
            <span className="text-blue-600">₵{total.toFixed(2)}</span>
          </div>

          <button
            onClick={handleCompleteSale}
            disabled={cart.length === 0}
            className={`w-full py-6 rounded-2xl transition-all shadow-lg hover:shadow-xl active:scale-95 ${
              cart.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
            }`}
          >
            Complete Sale
          </button>
        </div>
      </div>
    </div>
  );
}
