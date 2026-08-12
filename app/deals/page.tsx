'use client';
import { useEffect, useState } from 'react';

export default function DealsPage() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/deals')
      .then(res => res.json())
      .then(data => {
        setDeals(data.deals || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <main className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-extrabold text-slate-900 mb-2">🔥 AI Deals & Lifetime Offers</h1>
      <p className="text-slate-600 mb-8">Discover verified discounts, free trials, and special promotions on top AI tools.</p>
      
      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading active deals...</div>
      ) : deals.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 text-slate-600">
          No active deals found at the moment. Check back soon!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deals.map((deal: any) => (
            <div key={deal.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
              <h3 className="font-bold text-lg text-slate-900 mb-1">{deal.name}</h3>
              <p className="text-sm text-slate-600 mb-4 line-clamp-2">{deal.description}</p>
              <div className="flex items-center justify-between mt-auto">
                <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full">{deal.pricing}</span>
                <a href={deal.official_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:underline">
                  Claim Deal →
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
