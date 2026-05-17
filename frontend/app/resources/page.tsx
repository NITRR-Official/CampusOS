'use client';

import { useState, useEffect } from 'react';
import resourceAPI from '@/lib/resource-api';

interface Resource {
  id: string;
  name: string;
  type: string;
  quantity: number;
  availableQuantity: number;
  status: string;
}

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadResources() {
      try {
        setLoading(true);
        const data = (await resourceAPI.getAllResources()) as {
          resources: Resource[];
        };
        setResources(data.resources || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    }

    loadResources();
  }, []);

  if (loading) return <div className="p-4">Loading resources...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Resource Management</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded">
          Add Resource
        </button>
      </div>

      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">Name</th>
            <th className="border p-2 text-left">Type</th>
            <th className="border p-2 text-left">Quantity</th>
            <th className="border p-2 text-left">Available</th>
            <th className="border p-2 text-left">Status</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {resources.map((resource) => (
            <tr key={resource.id}>
              <td className="border p-2">{resource.name}</td>
              <td className="border p-2">{resource.type}</td>
              <td className="border p-2">{resource.quantity}</td>
              <td className="border p-2">{resource.availableQuantity}</td>
              <td className="border p-2">
                <span
                  className={`px-2 py-1 rounded text-sm ${
                    resource.status === 'available'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {resource.status}
                </span>
              </td>
              <td className="border p-2 text-center">
                <button className="text-blue-600 text-sm">View</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {resources.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>No resources yet. Create one to get started!</p>
        </div>
      )}
    </div>
  );
}
