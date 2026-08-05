// src/components/inventory/InventoryManager.tsx
// ============================================================
// AIMS — Inventory Management (Admin Only)
// ============================================================

import { useState } from 'react';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  minStock: number;
  location: string;
  lastUpdated: string;
}

const MOCK_INVENTORY: InventoryItem[] = [
  { id: 'inv-1', name: 'A4 Paper Reams', category: 'Stationery', quantity: 12, minStock: 20, location: 'Storage A', lastUpdated: '2026-08-03' },
  { id: 'inv-2', name: 'HP Toner Cartridges', category: 'Stationery', quantity: 3, minStock: 5, location: 'Storage A', lastUpdated: '2026-08-01' },
  { id: 'inv-3', name: 'Dell Laptops', category: 'Equipment', quantity: 15, minStock: 5, location: 'IT Room', lastUpdated: '2026-07-28' },
  { id: 'inv-4', name: 'Office Chairs', category: 'Furniture', quantity: 45, minStock: 10, location: 'Storage B', lastUpdated: '2026-07-15' },
  { id: 'inv-5', name: 'Whiteboard Markers', category: 'Stationery', quantity: 8, minStock: 15, location: 'Storage A', lastUpdated: '2026-08-02' },
  { id: 'inv-6', name: 'Projectors', category: 'Equipment', quantity: 4, minStock: 2, location: 'AV Room', lastUpdated: '2026-06-20' },
];

export function InventoryManager() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const categories = ['all', ...Array.from(new Set(MOCK_INVENTORY.map((i) => i.category)))];

  const filtered = MOCK_INVENTORY.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const lowStockCount = MOCK_INVENTORY.filter((i) => i.quantity < i.minStock).length;

  return (
    <div>
      {lowStockCount > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-yellow-600">warning</span>
            <p className="text-sm text-yellow-800">
              <strong>{lowStockCount} item(s)</strong> are below minimum stock level and need reordering.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Search inventory..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat} className="capitalize">{cat}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Item</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Quantity</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Min Stock</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Location</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const isLow = item.quantity < item.minStock;
              return (
                <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                  <td className="px-4 py-3 text-gray-600">{item.category}</td>
                  <td className="px-4 py-3 text-gray-800 font-medium">{item.quantity}</td>
                  <td className="px-4 py-3 text-gray-500">{item.minStock}</td>
                  <td className="px-4 py-3 text-gray-600">{item.location}</td>
                  <td className="px-4 py-3">
                    {isLow ? (
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Low Stock</span>
                    ) : (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">In Stock</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}