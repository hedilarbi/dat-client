'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '../../api';
import { useLanguage } from '../../i18n';

interface Notification { _id: string; title: string; message: string; readAt: string | null; createdAt: string }

export default function SellerNotificationsPage() {
  const { language, t } = useLanguage();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const result = await apiRequest('/notifications');
    setItems(result.notifications || []);
    setLoading(false);
  };
  useEffect(() => { refresh().catch(() => setLoading(false)); }, []);

  return (
    <div className="p-5 sm:p-8 max-w-4xl w-full mx-auto">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-[#13243c]">{t('notifications.title')}</h1>
        <button type="button" onClick={async () => { await apiRequest('/notifications/read-all', { method: 'PUT' }); await refresh(); }} className="text-sm font-semibold text-[#d9704f] hover:underline">{t('notifications.markAllRead')}</button>
      </div>
      {loading ? <div className="text-[#5a5e66]">…</div> : items.length === 0 ? <div className="border border-[#e4e0d6] p-8 text-center text-[#5a5e66]">{t('notifications.empty')}</div> : (
        <div className="border border-[#e4e0d6] bg-white">
          {items.map(item => <button key={item._id} type="button" onClick={async () => { if (!item.readAt) { await apiRequest(`/notifications/${item._id}/read`, { method: 'PUT' }); await refresh(); } }} className={`block w-full text-left p-5 border-b last:border-b-0 border-[#efece3] ${item.readAt ? 'bg-white' : 'bg-[#fff7f1]'}`}>
            <div className="flex justify-between gap-4"><strong className="text-[#13243c]">{item.title}</strong>{!item.readAt && <span className="mt-2 w-2 h-2 rounded-full bg-[#d9704f] shrink-0" />}</div>
            <p className="mt-1 text-sm text-[#5a5e66]">{item.message}</p>
            <time className="block mt-2 text-xs text-[#777]">{new Date(item.createdAt).toLocaleString(language === 'en' ? 'en-GB' : 'fr-FR')}</time>
          </button>)}
        </div>
      )}
    </div>
  );
}
