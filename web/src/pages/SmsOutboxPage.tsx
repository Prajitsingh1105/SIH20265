import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { SmsOutbox } from '../types';
import { MessageSquare, RefreshCw, CheckCircle2, Phone, Search } from 'lucide-react';

export const SmsOutboxPage: React.FC = () => {
  const [messages, setMessages] = useState<SmsOutbox[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchOutbox = async () => {
    try {
      setLoading(true);
      const res = await api.getSmsOutbox();
      if (res.success) {
        setMessages(res.data);
      }
    } catch (e) {
      console.error('Failed to load SMS outbox:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutbox();
  }, []);

  const filtered = messages.filter(
    (m) =>
      m.recipientPhone.includes(search) ||
      m.message.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-gov-navy-900" />
            <h1 className="text-xl font-black text-gov-navy-900">
              In-App SMS Gateway Outbox
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Real-time inspection queue logging 2FA login OTPs, 90/60/30/7-day maturity reminders, discrepancy alerts, and release sanction updates.
          </p>
        </div>

        <button
          onClick={fetchOutbox}
          className="flex items-center space-x-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 transition shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Outbox</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center">
        <Search className="w-4 h-4 text-gray-400 mr-2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by recipient phone or SMS text..."
          className="w-full text-xs border-0 focus:ring-0 p-0 text-gray-800 placeholder-gray-400"
        />
      </div>

      {/* Messages Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gov-navy-900 text-white font-semibold">
              <tr>
                <th className="py-3 px-4">Dispatched At</th>
                <th className="py-3 px-4">Recipient Phone</th>
                <th className="py-3 px-4">Message Content</th>
                <th className="py-3 px-4 text-right">Gateway Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500">
                    Loading SMS records...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500">
                    No SMS messages found in outbox.
                  </td>
                </tr>
              ) : (
                filtered.map((msg) => (
                  <tr key={msg.id} className="hover:bg-gray-50 transition">
                    <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                      {new Date(msg.sentAt).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-gov-navy-900 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        <span>{msg.recipientPhone}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-sans text-gray-800 max-w-xl">
                      {msg.message}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{msg.status}</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
