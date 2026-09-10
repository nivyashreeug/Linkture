import { useState } from 'react';
import api from '../services/api';

const ConnectionActions = ({ targetUserId, initialStatus = 'none', initialConnectionId = null, onStatusChange }) => {
  const [status, setStatus] = useState(initialStatus);
  const [connectionId, setConnectionId] = useState(initialConnectionId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendRequest = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.post('/connections/request', { recipientId: targetUserId });
      setStatus('pending_sent');
      setConnectionId(response.data.connection?._id || response.data.connection?.id);
      if (onStatusChange) onStatusChange('pending_sent', response.data.connection);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!connectionId) return;
    try {
      setLoading(true);
      setError('');
      const response = await api.patch(`/connections/${connectionId}`, { status: newStatus });
      setStatus(newStatus);
      if (onStatusChange) onStatusChange(newStatus, response.data.connection);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${newStatus} request`);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'accepted') {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-400/30 bg-teal-400/15 px-3 py-1 text-xs font-semibold text-teal-200">
          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Connected
        </span>
      </div>
    );
  }

  if (status === 'pending_sent') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-200">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
        Request Sent
      </span>
    );
  }

  if (status === 'pending_received') {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => handleUpdateStatus('accepted')}
          disabled={loading}
          className="rounded-xl bg-teal px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-teal/90 disabled:opacity-50"
        >
          {loading ? '...' : 'Accept'}
        </button>
        <button
          type="button"
          onClick={() => handleUpdateStatus('declined')}
          disabled={loading}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10 disabled:opacity-50"
        >
          Decline
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleSendRequest}
        disabled={loading}
        className="primary-button text-xs py-2 px-4 w-full sm:w-auto"
      >
        {loading ? 'Sending...' : 'Connect'}
      </button>
      {error ? <p className="mt-1 text-[0.7rem] text-rose-300">{error}</p> : null}
    </div>
  );
};

export default ConnectionActions;
