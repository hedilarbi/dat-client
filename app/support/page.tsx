'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '../api';
import { useUser } from '../components/LayoutWrapper';
import { useLanguage } from '../i18n';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';
import SkeletonRows from '../components/SkeletonRows';
import { Badge, getTicketStatusBadge } from '../components/StatusBadge';
import { getCategoryLabel } from '../lib/categoryLabels';
import { compressImageIfNeeded, MAX_UPLOAD_BYTES } from '../lib/imageCompression';

interface Message {
  _id: string;
  sender: {
    _id: string;
    firstName: string;
    lastName: string;
    role: string;
    companyName: string;
  };
  senderRole: 'admin' | 'vendeur' | 'acheteur';
  content: string;
  attachments?: string[];
  createdAt: string;
}

interface Ticket {
  _id: string;
  title: string;
  category: string;
  priority: string;
  status: 'ouverte' | 'en_attente_admin' | 'en_attente_utilisateur' | 'en_cours' | 'cloturee' | 'reouverte';
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export default function SupportPage() {
  const router = useRouter();
  const { user } = useUser();
  const { t } = useLanguage();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  
  // Search and new ticket
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpeningForm, setIsOpeningForm] = useState(false);
  
  // Form fields
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [newPriority, setNewPriority] = useState('normale');
  const [newMessageContent, setNewMessageContent] = useState('');
  
  // Conversation thread
  const [replyContent, setReplyContent] = useState('');
  const [replyFile, setReplyFile] = useState('');
  const [replyFileName, setReplyFileName] = useState('');
  const [uploading, setUploading] = useState(false);

  // UI States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/tickets');
      setTickets(res.tickets);
      
      // Auto select first ticket if available
      if (res.tickets.length > 0 && !selectedTicket) {
        fetchTicketDetails(res.tickets[0]._id);
      }
    } catch (err: any) {
      setError(t('support.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketDetails = async (ticketId: string) => {
    try {
      const res = await apiRequest(`/tickets/${ticketId}`);
      setSelectedTicket(res.ticket);
      setIsOpeningForm(false);
    } catch (err: any) {
      setError(t('support.loadConversationError'));
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleOpenTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newMessageContent) return;

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await apiRequest('/tickets', {
        method: 'POST',
        body: JSON.stringify({
          title: newTitle,
          category: newCategory,
          priority: newPriority,
          messageContent: newMessageContent,
        }),
      });

      setMessage(t('support.ticketCreatedSuccess'));
      setNewTitle('');
      setNewMessageContent('');
      setIsOpeningForm(false);

      await fetchTickets();
      await fetchTicketDetails(res.ticket._id);
    } catch (err: any) {
      setError(err.message || t('support.createError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSendReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyContent) return;

    setError('');
    try {
      const attachments = replyFile ? [replyFile] : [];
      const res = await apiRequest(`/tickets/${selectedTicket._id}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          content: replyContent,
          attachments,
        }),
      });

      setReplyContent('');
      setReplyFile('');
      setReplyFileName('');
      setSelectedTicket(res.ticket);
      fetchTickets();
    } catch (err: any) {
      setError(t('support.sendMessageError'));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    setError('');

    const file = await compressImageIfNeeded(rawFile);
    if (file.size > MAX_UPLOAD_BYTES) {
      setError(t('shared.fileTooLarge', {
        size: (file.size / (1024 * 1024)).toFixed(1),
        maxSize: String(MAX_UPLOAD_BYTES / (1024 * 1024)),
      }));
      e.target.value = '';
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const responseText = await res.text();
      let data: any = {};
      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          throw new Error(t('support.attachmentUploadError'));
        }
      }

      if (!res.ok || !data.url) {
        throw new Error(data.message || t('support.attachmentUploadError'));
      }

      setReplyFile(data.url);
      setReplyFileName(file.name);
    } catch (err: any) {
      setError(err.message || t('support.attachmentUploadError'));
      setReplyFile('');
      setReplyFileName('');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // Filtered tickets
  const filteredTickets = tickets.filter(ticket =>
    ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.category.toLowerCase().includes(searchQuery.toLowerCase())
  );


  const isDetailOpen = Boolean(selectedTicket) || isOpeningForm;

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full min-h-0 bg-white font-sans text-black">
      {/* Left Tickets Panel */}
      <div className={`${isDetailOpen ? 'hidden lg:flex' : 'flex'} w-full lg:w-[360px] border-r border-[#eceadf] flex-col shrink-0 select-none`}>
        <div className="p-[22px_20px_16px]">
          <h2 className="text-[24px] font-bold font-heading uppercase text-[#13243c] mb-[14px]">
            {t('support.myTickets')}
          </h2>
          <input
            type="text"
            placeholder={t('support.searchPlaceholder')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-[44px] border border-[#dcd7cb] rounded-[9px] px-4 text-[13px] text-[#1a2230] placeholder-[#9a917d] mb-3 focus:outline-none focus:ring-1 focus:ring-[#13243c]"
          />
          <button
            onClick={() => {
              setIsOpeningForm(true);
              setSelectedTicket(null);
            }}
            className="w-full h-[46px] rounded-[9px] bg-[#13243c] hover:bg-slate-800 text-white font-bold text-[13px] uppercase tracking-[0.03em] select-none cursor-pointer"
          >
            {t('support.newTicket')}
          </button>
        </div>

        {/* Tickets Scroll List */}
        <div className="flex-1 overflow-y-auto border-t border-[#efece3]">
          {loading && tickets.length === 0 ? (
            <SkeletonRows />
          ) : filteredTickets.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-400">{t('support.noTickets')}</div>
          ) : (
            filteredTickets.map(ticket => {
              const meta = getTicketStatusBadge(ticket.status, t);
              const isSelected = selectedTicket?._id === ticket._id;
              // Row highlighting based on status
              const isPendingUser = ticket.status === 'en_attente_utilisateur';
              const isPendingAdmin = ticket.status === 'en_attente_admin';

              let rowBg = '#fff';
              let rowAccent = '#fff';

              if (isPendingUser) {
                rowBg = '#fdfbf7';
                rowAccent = '#d9704f';
              } else if (isPendingAdmin) {
                rowBg = '#fdf6ee';
                rowAccent = '#b3893f';
              }

              if (isSelected) {
                rowBg = '#f5f7fa';
                rowAccent = '#13243c';
              }

              return (
                <div
                  key={ticket._id}
                  onClick={() => fetchTicketDetails(ticket._id)}
                  style={{ background: rowBg, borderLeft: `3px solid ${rowAccent}` }}
                  className="p-[16px_20px] border-b border-[#efece3] cursor-pointer transition-colors duration-150"
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[11px] font-bold text-[#8a8270] uppercase tracking-[0.04em]">
                      {getCategoryLabel(ticket.category, t)}
                    </span>
                    <span className="text-[11px] text-[#9a917d]">
                      {new Date(ticket.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-[14px] font-semibold text-[#13243c] leading-[1.3] mb-2 truncate">
                    {ticket.title}
                  </div>
                  <Badge style={meta} className="px-[10px] py-[5px]" />
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Conversation Panel */}
      <div className={`${isDetailOpen ? 'flex' : 'hidden lg:flex'} flex-1 flex-col min-w-0 bg-[#fbfaf7]`}>
        {/* Error/Success Messages */}
        {error && <Alert variant="error">{error}</Alert>}
        {message && <Alert variant="success">{message}</Alert>}

        {/* OPEN NEW TICKET FORM */}
        {isOpeningForm && (
          <form onSubmit={handleOpenTicketSubmit} className="flex-1 p-6 sm:p-8 space-y-6 overflow-y-auto bg-white">
            <button
              type="button"
              onClick={() => setIsOpeningForm(false)}
              className="lg:hidden text-[13px] font-semibold text-[#8a8270] hover:underline"
            >
              {t('support.backToList')}
            </button>
            <h3 className="text-[22px] font-bold font-heading uppercase text-[#13243c] border-b pb-2 mb-4">
              {t('support.createNewTicketTitle')}
            </h3>

            <div>
              <label className="block text-[12px] font-semibold text-[#4c5058] mb-2">{t('support.ticketSubject')}</label>
              <input
                required
                type="text"
                placeholder={t('support.ticketSubjectPlaceholder')}
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="w-full h-12 border border-[#dcd7cb] rounded-[9px] px-4 text-sm text-[#1a2230] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-[12px] font-semibold text-[#4c5058] mb-2">{t('support.category')}</label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  className="w-full h-12 border border-[#dcd7cb] rounded-[9px] px-4 text-sm text-[#1a2230] focus:outline-none bg-white"
                >
                  <option value="general">{t('support.categoryGeneral')}</option>
                  <option value="inscription">{t('support.categoryInscription')}</option>
                  <option value="document">{t('support.categoryDocument')}</option>
                  <option value="paiement">{t('support.categoryPaiement')}</option>
                  <option value="technique">{t('support.categoryTechnique')}</option>
                  <option value="enlèvement">{t('support.categoryEnlevement')}</option>
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#4c5058] mb-2">{t('support.urgency')}</label>
                <select
                  value={newPriority}
                  onChange={e => setNewPriority(e.target.value)}
                  className="w-full h-12 border border-[#dcd7cb] rounded-[9px] px-4 text-sm text-[#1a2230] focus:outline-none bg-white"
                >
                  <option value="basse">{t('support.priorityLow')}</option>
                  <option value="normale">{t('support.priorityNormal')}</option>
                  <option value="haute">{t('support.priorityHigh')}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#4c5058] mb-2">{t('support.detailedDescription')}</label>
              <textarea
                required
                rows={6}
                placeholder={t('support.descriptionPlaceholder')}
                value={newMessageContent}
                onChange={e => setNewMessageContent(e.target.value)}
                className="w-full border border-[#dcd7cb] rounded-[9px] p-4 text-sm text-[#1a2230] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[52px] rounded-[9px] bg-[#13243c] hover:bg-slate-800 text-white font-bold text-[15px] uppercase tracking-[0.03em] transition disabled:opacity-50 select-none cursor-pointer flex items-center justify-center gap-2"
            >
              {loading && <Spinner />}
              {loading ? t('support.creating') : t('support.sendRequest')}
            </button>
          </form>
        )}

        {/* CHAT THREAD VIEW */}
        {selectedTicket && !isOpeningForm && (
          <div className="flex-1 flex flex-col h-full min-h-0 bg-white">
            {/* Thread Header */}
            <div className="p-[18px_20px] sm:p-[22px_32px] border-b border-[#eceadf] flex justify-between items-center select-none shrink-0 gap-3">
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="lg:hidden text-[13px] font-semibold text-[#8a8270] hover:underline mb-1.5 block"
                >
                  {t('support.backToList')}
                </button>
                <div className="text-[11px] font-semibold text-[#8a8270] uppercase tracking-[0.04em] mb-1.5">
                  {getCategoryLabel(selectedTicket.category, t)}
                </div>
                <h3 className="text-[22px] font-bold font-heading uppercase text-[#13243c] truncate">
                  {selectedTicket.title}
                </h3>
              </div>
              <div>
                <Badge style={getTicketStatusBadge(selectedTicket.status, t)} className="px-[12px] py-[6px]" />
              </div>
            </div>

            {/* Scrollable Conversation bubbles */}
            <div className="flex-1 overflow-y-auto p-[28px_32px] flex flex-col gap-[18px] bg-[#fbfaf7] min-h-0">
              {selectedTicket.messages.map((msg, index) => {
                const isAdmin = msg.senderRole === 'admin';
                // User bubble: background: #eceadf, text: #1a2230
                // Admin bubble: background: #13243c, text: #fff
                const bubbleBg = isAdmin ? '#13243c' : '#eceadf';
                const bubbleColor = isAdmin ? '#fff' : '#1a2230';
                const align = isAdmin ? 'flex-end' : 'flex-start';

                return (
                  <div
                    key={msg._id || index}
                    style={{ alignSelf: align, alignItems: align }}
                    className="flex flex-col max-w-[70%]"
                  >
                    <div className="text-[11px] font-medium text-[#9a917d] mb-[6px] select-none">
                      {isAdmin ? t('support.supportTeamName') : `${msg.sender?.firstName || t('support.me')} ${msg.sender?.lastName || ''}`} · {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div
                      style={{ background: bubbleBg, color: bubbleColor }}
                      className="p-[14px_18px] rounded-[12px] text-[14px] leading-[1.5]"
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-2 border-t pt-1 border-dashed border-gray-400 select-none">
                          {msg.attachments.map((url, uidx) => (
                            <a key={uidx} href={url} target="_blank" rel="noreferrer" className="text-[11px] font-bold underline block truncate hover:opacity-80">
                              📎 {t('support.attachment')} {uidx + 1}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Write answer footer */}
            {selectedTicket.status !== 'cloturee' ? (
              <form onSubmit={handleSendReplySubmit} className="p-[14px_16px] sm:p-[20px_32px] border-t border-[#eceadf] flex gap-3 shrink-0">
                <input
                  type="text"
                  placeholder={t('support.replyPlaceholder')}
                  value={replyContent}
                  onChange={e => setReplyContent(e.target.value)}
                  className="flex-1 h-[52px] border border-[#dcd7cb] rounded-[9px] px-4 text-[14px] focus:outline-none min-w-0"
                />

                {/* File Upload Trigger */}
                <label className={`h-[52px] border rounded-[9px] px-4 flex items-center gap-2 max-w-[160px] transition cursor-pointer text-sm shrink-0 ${replyFile ? 'border-[#bcd8c8] bg-[#f2f8f4] text-[#2f6f4f]' : 'border-[#dcd7cb] bg-gray-50 hover:bg-gray-100'}`}>
                  {uploading ? <Spinner /> : (replyFile ? '✓' : '📎')}
                  {replyFile && !uploading && <span className="truncate text-[12px] font-semibold">{replyFileName}</span>}
                  <input type="file" onChange={handleFileUpload} className="hidden" disabled={uploading} />
                </label>

                <button
                  type="submit"
                  disabled={!replyContent || uploading}
                  className="w-auto px-4 sm:w-[130px] h-[52px] rounded-[9px] bg-[#13243c] hover:bg-slate-800 text-white font-bold text-[13px] uppercase tracking-[0.03em] select-none cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
                >
                  {uploading && <Spinner />}
                  {uploading ? t('shared.uploading') : t('support.send')}
                </button>
              </form>
            ) : (
              <div className="p-6 border-t border-[#eceadf] text-center text-sm text-[#9a917d] select-none">
                🔒 {t('support.ticketClosed')}
              </div>
            )}
          </div>
        )}

        {!selectedTicket && !isOpeningForm && (
          <div className="flex-1 hidden lg:flex items-center justify-center text-[#9a917d] select-none font-medium text-sm text-center px-6">
            {t('support.selectPrompt')}
          </div>
        )}
      </div>
    </div>
  );
}
