import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Radio, CheckCircle2, RefreshCw, Zap, Server, ExternalLink } from 'lucide-react';

export const IntegrationsPage: React.FC = () => {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, any>>({});

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const res = await api.getIntegrations();
      if (res.success) {
        setIntegrations(res.data);
      }
    } catch (e) {
      console.error('Failed to load integrations:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const handleTestConnection = async (id: string) => {
    setTestingId(id);
    try {
      const res = await api.testIntegration(id);
      setTestResults((prev) => ({ ...prev, [id]: res }));
    } catch (e: any) {
      setTestResults((prev) => ({
        ...prev,
        [id]: { status: 'DEGRADED', message: e.message || 'Connection test failed' },
      }));
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Radio className="w-5 h-5 text-gov-navy-900" />
            <h1 className="text-xl font-black text-gov-navy-900">
              Inter-System Integrations & Adapter Hub
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Built using the Adapter Pattern (`BankVerificationAdapter`, `AicteSystemAdapter`) to plug directly into live government & banking CBS infrastructure.
          </p>
        </div>

        <button
          onClick={fetchIntegrations}
          className="flex items-center space-x-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 transition shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* Architecture Context Banner */}
      <div className="bg-gradient-to-r from-gov-navy-900 to-gov-navy-800 text-white p-5 rounded-xl shadow-xs space-y-2">
        <h3 className="font-extrabold text-xs uppercase tracking-wider text-amber-400">
          🏛️ Built to Plug In (SIH Architecture Alignment)
        </h3>
        <p className="text-xs text-gray-300 leading-relaxed">
          The DEPOSIT-TRACK architecture completely decouples domain business logic from physical CBS networks. In deployment mode, switching `BANK_CBS_MODE=live` connects directly to SFMS / NPCI bank endpoints with zero frontend alterations.
        </p>
      </div>

      {/* Integration Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 bg-white p-8 rounded-xl border border-gray-200 text-center text-xs text-gray-500">
            Loading external system status...
          </div>
        ) : (
          integrations.map((item) => {
            const result = testResults[item.id];
            const isTesting = testingId === item.id;

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 flex flex-col justify-between space-y-4 hover:border-gov-navy-300 transition"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {item.category}
                      </span>
                      <h3 className="font-bold text-sm text-gov-navy-900 mt-1">{item.name}</h3>
                      <p className="text-[11px] text-gray-400 font-mono mt-0.5">{item.provider}</p>
                    </div>

                    <div className="flex flex-col items-end shrink-0">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{item.status}</span>
                      </span>
                      <span className="text-[10px] text-gray-400 mt-0.5 font-mono">
                        Latency: {item.latencyMs}ms
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed">{item.details}</p>

                  {/* Endpoints */}
                  <div className="space-y-1 bg-gray-50 p-3 rounded-lg border border-gray-100 text-[11px]">
                    <span className="font-bold text-gray-700 block">Registered Gateway Endpoints:</span>
                    {item.endpoints.map((ep: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-gray-600 font-mono text-[10px]">
                        <span>{ep.name}</span>
                        <span className="text-gov-navy-light font-bold">[{ep.method}] {ep.url}</span>
                      </div>
                    ))}
                  </div>

                  {/* Test Ping Result */}
                  {result && (
                    <div
                      className={`p-3 rounded-lg text-xs font-mono space-y-0.5 ${
                        result.status === 'ONLINE'
                          ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                          : 'bg-red-50 text-red-900 border border-red-200'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span>Handshake Result: {result.status}</span>
                        <span>{result.latencyMs} ms</span>
                      </div>
                      <p className="text-[11px] font-sans">{result.message}</p>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 font-mono">
                    Mode: <strong className="text-gray-700">{item.mode}</strong>
                  </span>

                  <button
                    onClick={() => handleTestConnection(item.id)}
                    disabled={isTesting}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-gov-navy-900 hover:bg-gov-navy-800 text-amber-400 font-bold text-xs rounded-lg shadow-xs transition disabled:opacity-50"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>{isTesting ? 'Pinging Gateway...' : 'Test Connection'}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
