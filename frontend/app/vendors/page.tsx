'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import vendorAPI from '@/lib/vendor-api';

export default function VendorsPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    try {
      setLoading(true);
      const data = await vendorAPI.getAllVendors();
      setVendors(data.vendors || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-4">Loading vendors...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Vendor Management</h1>
        <Link href="/vendors/new" className="bg-blue-600 text-white px-4 py-2 rounded">
          Add Vendor
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vendors.map(vendor => (
          <div key={vendor.id} className="border rounded-lg p-4 hover:shadow-lg">
            <h3 className="font-bold text-lg">{vendor.name}</h3>
            <p className="text-sm text-gray-600">{vendor.category}</p>
            <p className="text-sm">Contact: {vendor.contactPerson}</p>
            <p className="text-sm">{vendor.phone}</p>
            <div className="mt-3 flex gap-2">
              <Link href={`/vendors/${vendor.id}`} className="text-blue-600 text-sm">
                View
              </Link>
              <button className="text-gray-600 text-sm">Edit</button>
            </div>
          </div>
        ))}
      </div>

      {vendors.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>No vendors yet. Create one to get started!</p>
        </div>
      )}
    </div>
  );
}
