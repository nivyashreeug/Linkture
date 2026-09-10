import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const NetworkHub = ({ title = 'Network & Connections' }) => {
  const { user: currentUser } = useAuth();
  const [data, setData] = useState({ received: [], sent: [], accepted: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('received');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const res = await api.get('/connections');
      setData({
        received: res.data.received || [],
        sent: res.data.sent || [],
        accepted: res.data.accepted || [],
      });
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load connections.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  const handleAction = async (id, status) => {
    try {
      setActionLoading(true);
      await api.patch(`/connections/${id}`, { status });
      await fetchConnections();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${status} request.`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="glass-panel rounded-[2rem] p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-teal-300">Live Network</p>
          <h3 className="mt-1 text-xl font-semibold text-white">{title}</h3>
        </div>
        <div className="flex gap-1.5 rounded-2xl border border-white/10 bg-slate-950/60 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('received')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'received' ? 'bg-gold text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            Received ({data.received.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sent')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'sent' ? 'bg-gold text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            Sent ({data.sent.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('accepted')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'accepted' ? 'bg-gold text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            Connected ({data.accepted.length})
          </button>
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">
          {error}
        </p>
      ) : null}

      <div className="mt-4">
        {loading ? (
          <p className="py-6 text-center text-xs text-slate-400">Loading network...</p>
        ) : (
          <>
            {activeTab === 'received' && (
              <div className="space-y-3">
                {data.received.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-400">No pending connection requests received.</p>
                ) : (
                  data.received.map((conn) => {
                    const otherUser = conn.requester || {};
                    return (
                      <div
                        key={conn._id || conn.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-white text-sm">
                              {otherUser.startupProfile?.companyName || otherUser.roleDetails?.startup?.startupName || otherUser.roleDetails?.vc?.firmName || otherUser.fullName}
                            </p>
                            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[0.65rem] font-semibold text-teal-200">
                              {otherUser.role}
                            </span>
                          </div>
                          {conn.message ? (
                            <p className="mt-1 text-xs text-slate-300 italic">"{conn.message}"</p>
                          ) : null}
                          <p className="mt-1 text-[0.7rem] text-slate-400">{otherUser.location || otherUser.bio || 'Linkture member'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleAction(conn._id || conn.id, 'accepted')}
                            disabled={actionLoading}
                            className="rounded-xl bg-teal px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-teal/90"
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAction(conn._id || conn.id, 'declined')}
                            disabled={actionLoading}
                            className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activeTab === 'sent' && (
              <div className="space-y-3">
                {data.sent.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-400">No sent requests currently pending.</p>
                ) : (
                  data.sent.map((conn) => {
                    const otherUser = conn.recipient || {};
                    return (
                      <div
                        key={conn._id || conn.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-white text-sm">
                              {otherUser.startupProfile?.companyName || otherUser.roleDetails?.startup?.startupName || otherUser.roleDetails?.vc?.firmName || otherUser.fullName}
                            </p>
                            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[0.65rem] font-semibold text-slate-200">
                              {otherUser.role}
                            </span>
                          </div>
                          <p className="mt-1 text-[0.7rem] text-slate-400">{otherUser.location || 'Awaiting response'}</p>
                        </div>
                        <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs text-amber-200">
                          Pending
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activeTab === 'accepted' && (
              <div className="space-y-3">
                {data.accepted.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-400">No active connections yet. Start connecting with founders & investors!</p>
                ) : (
                  data.accepted.map((conn) => {
                    const currentId = currentUser?._id || currentUser?.id;
                    const isRequester = String(conn.requester?._id || conn.requester?.id || conn.requester) === String(currentId);
                    const otherUser = isRequester ? conn.recipient : conn.requester;
                    return (
                      <div
                        key={conn._id || conn.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-teal-500/20 bg-slate-950/40 p-4"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-white text-sm">
                              {otherUser?.startupProfile?.companyName || otherUser?.roleDetails?.startup?.startupName || otherUser?.roleDetails?.vc?.firmName || otherUser?.fullName}
                            </p>
                            <span className="rounded-full bg-teal-400/15 px-2 py-0.5 text-[0.65rem] font-semibold text-teal-200">
                              {otherUser?.role}
                            </span>
                          </div>
                          <p className="mt-1 text-[0.7rem] text-slate-400">{otherUser?.location || otherUser?.bio || 'Connected member'}</p>
                        </div>
                        <span className="rounded-full border border-teal-400/30 bg-teal-400/15 px-3 py-1 text-xs font-semibold text-teal-200">
                          ✓ Connected
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NetworkHub;
