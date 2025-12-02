import React, { useState } from 'react';
import { Printer, Search, Calendar, DollarSign } from 'lucide-react';
import { Sale } from '../App';

interface SalesHistoryProps {
  sales: Sale[];
}

export default function SalesHistory({ sales }: SalesHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSales = sales.filter(sale =>
    sale.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sale.date.includes(searchQuery) ||
    sale.paymentMethod.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
  const todaysSales = sales.filter(sale => sale.date === new Date().toLocaleDateString());
  const todaysRevenue = todaysSales.reduce((sum, sale) => sum + sale.total, 0);

  const handlePrintReceipt = (sale: Sale) => {
    // In a real app, this would open a print dialog with the specific receipt
    alert(`Printing receipt ${sale.id}`);
  };

  return (
    <div className="h-full bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-gray-800 mb-6">Sales History</h2>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-2xl p-6 shadow-md border-2 border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-600">Total Sales</span>
                <Calendar className="w-6 h-6 text-blue-500" />
              </div>
              <p className="text-gray-800">{sales.length}</p>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-md border-2 border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-600">Today's Sales</span>
                <Calendar className="w-6 h-6 text-teal-500" />
              </div>
              <p className="text-gray-800">{todaysSales.length}</p>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-md border-2 border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-600">Total Revenue</span>
                <DollarSign className="w-6 h-6 text-green-500" />
              </div>
              <p className="text-green-600">${totalRevenue.toFixed(2)}</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-xl">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by receipt #, date, or payment method..."
              className="w-full pl-16 pr-6 py-5 border-2 border-gray-200 rounded-2xl text-lg bg-white focus:outline-none focus:border-blue-500 transition-colors shadow-sm"
            />
          </div>
        </div>

        {/* Sales Table */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden">
          {filteredSales.length === 0 ? (
            <div className="text-center py-16">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-400">No sales found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-100">
                  <tr>
                    <th className="text-left px-8 py-5 text-gray-600">Receipt #</th>
                    <th className="text-left px-8 py-5 text-gray-600">Date</th>
                    <th className="text-left px-8 py-5 text-gray-600">Time</th>
                    <th className="text-left px-8 py-5 text-gray-600">Items</th>
                    <th className="text-left px-8 py-5 text-gray-600">Payment</th>
                    <th className="text-left px-8 py-5 text-gray-600">Amount</th>
                    <th className="text-left px-8 py-5 text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map((sale) => (
                    <tr key={sale.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-8 py-5 text-gray-700">{sale.id}</td>
                      <td className="px-8 py-5 text-gray-700">{sale.date}</td>
                      <td className="px-8 py-5 text-gray-700">{sale.time}</td>
                      <td className="px-8 py-5 text-gray-700">
                        {sale.items.reduce((sum, item) => sum + item.quantity, 0)} items
                      </td>
                      <td className="px-8 py-5 text-gray-700">{sale.paymentMethod}</td>
                      <td className="px-8 py-5 text-green-600">${sale.total.toFixed(2)}</td>
                      <td className="px-8 py-5">
                        <button
                          onClick={() => handlePrintReceipt(sale)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors active:scale-95"
                        >
                          <Printer className="w-4 h-4" />
                          Reprint
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
