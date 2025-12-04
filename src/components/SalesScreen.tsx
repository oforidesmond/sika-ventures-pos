import React, { useCallback, useEffect, useState } from 'react';
import { Search, Minus, Plus, Trash2, ShoppingBag, ChevronDown } from 'lucide-react';
import { CartItem, Sale, PaymentMethod, paymentMethodLabels } from '../types/sales';

interface Product {
  id: string;
  name: string;
  sellingPrice: number;
}

const PRODUCTS_API_URL = import.meta.env.VITE_PRODUCTS_API_URL ?? '/api/products';

interface SalesScreenProps {
  cart: CartItem[];
  setCart: (cart: CartItem[]) => void;
  onCompleteSale: (sale: Sale) => Promise<void>;
}

const paymentMethods: PaymentMethod[] = ['CASH', 'MOBILE_MONEY', 'CARD', 'TRANSFER'];

export default function SalesScreen({ cart, setCart, onCompleteSale }: SalesScreenProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [discount, setDiscount] = useState(0);
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [customerName, setCustomerName] = useState('');
  const [isCompletingSale, setIsCompletingSale] = useState(false);
  
  const fetchProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    setProductsError(null);

    try {
      const response = await fetch(PRODUCTS_API_URL);
      if (!response.ok) {
        throw new Error(`Failed to load products (status ${response.status})`);
      }

      const payload = await response.json();
      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.products)
            ? payload.products
            : [];

      if (!Array.isArray(list)) {
        throw new Error('Unexpected products response shape');
      }

      const normalizedProducts: Product[] = list
        .map((item: any) => ({
          id: String(item.id ?? item._id ?? ''),
          name: item.name ?? 'Unnamed Product',
          sellingPrice: Number(item.sellingPrice ?? item.price ?? 0),
        }))
        .filter((product) => product.id && product.name && !Number.isNaN(product.sellingPrice));

      setProducts(normalizedProducts);
    } catch (error) {
      console.error('Failed to fetch products', error);
      setProductsError(error instanceof Error ? error.message : 'Failed to load products');
      setProducts([]);
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);
  
  const filteredProducts = products.filter(product => 
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
      setCart([...cart, { ...product, price: product.sellingPrice, quantity: 1 }]);
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

  const handleCompleteSale = async () => {
    if (cart.length === 0 || isCompletingSale) return;

    setIsCompletingSale(true);
    try {
      const now = new Date();
      const authUserRaw = localStorage.getItem('authUser');
      const authUser = authUserRaw ? JSON.parse(authUserRaw) : null;
      const userId = authUser?.id ?? 'offline-user';
      const receiptNumber = `POS-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${now.getTime().toString().slice(-4)}`;
      const sale: Sale = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `SALE-${Date.now()}`,
        receiptNumber,
        userId,
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString(),
        items: [...cart],
        subtotal,
        discount,
        totalAmount: total,
        paymentMethod,
        customerName: customerName.trim() || undefined,
        synced: false,
      };

      await onCompleteSale(sale);
    } finally {
      setIsCompletingSale(false);
    }
  };

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
              autoFocus
              className="w-full pl-16 pr-6 py-5 border-2 border-gray-200 rounded-2xl text-lg focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {isLoadingProducts && (
              <div className="col-span-full py-10 text-center text-gray-500">
                Loading products...
              </div>
            )}

            {!isLoadingProducts && productsError && (
              <div className="col-span-full text-center bg-red-50 border border-red-200 text-red-600 p-8 rounded-2xl">
                <p className="mb-4 font-medium">{productsError}</p>
                <button
                  onClick={fetchProducts}
                  className="px-5 py-3 bg-red-600 text-white rounded-xl hover:bg-red-500 transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            {!isLoadingProducts && !productsError && filteredProducts.length === 0 && (
              <div className="col-span-full py-10 text-center text-gray-500">
                No products found.
              </div>
            )}

            {!isLoadingProducts && !productsError && filteredProducts.map(product => (
              <div
                key={product.id}
                className="bg-white border-2 border-gray-100 rounded-2xl p-6 hover:border-blue-500 hover:shadow-lg transition-all"
              >
                <div className="mb-4">
                  <h4 className="text-gray-800">{product.name}</h4>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-blue-600">₵{product.sellingPrice.toFixed(2)}</span>
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
      <div style={{width: '35rem'}} className="bg-gray-50 border-l-2 border-gray-100 flex flex-col">
        <div className="p-3 border-b-2 border-gray-100">
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
                {paymentMethodLabels[paymentMethod]}
                <ChevronDown className="w-5 h-4 text-gray-500" />
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
                        {paymentMethodLabels[method]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Customer Name Input */}
        <div className="px-6 pb-4">
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Customer Name (Optional)"
            className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors bg-white"
          />
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-2">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-400">Cart is empty</p>
            </div>
          ) : (
            <div className="space-y-2">
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
        <div className="border-t-2 border-gray-100 p-3 space-y-2">
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
              step="1"
            />
          </div>

          <div className="flex justify-between pt-4 border-t-2 border-gray-200">
            <span>Total:</span>
            <span className="text-blue-600">₵{total.toFixed(2)}</span>
          </div>

          <button
            onClick={handleCompleteSale}
            disabled={cart.length === 0 || isCompletingSale}
            className={`w-full py-6 rounded-2xl transition-all shadow-lg hover:shadow-xl active:scale-95 ${
              cart.length === 0 || isCompletingSale
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
            }`}
          >
            {isCompletingSale ? 'Processing...' : 'Complete Sale'}
          </button>
        </div>
      </div>
    </div>
  );
}
