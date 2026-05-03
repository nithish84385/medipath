import { useState, useRef, useEffect } from 'react';
import { Send, X, MessageCircle, Loader2 } from 'lucide-react';
import { db } from '../lib/firebase';
import {
  collection, addDoc, onSnapshot, query, orderBy, serverTimestamp,
} from 'firebase/firestore';

export default function ChatPanel({ chatId, user, isOpen, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!isOpen || !chatId) return;
    setLoading(true);
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'asc')
    );
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [isOpen, chatId]);

  const sendMessage = async () => {
    if (!input.trim() || !chatId) return;
    const text = input.trim();
    setInput('');
    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text,
        from: user?.uid || 'unknown',
        senderName: user?.name || user?.email || 'Unknown',
        role: user?.role || 'patient',
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      console.error('Chat send error:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="chat-panel fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <MessageCircle size={16} color="var(--primary)" />
          <div>
            <div className="text-sm font-semibold">Care Chat</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Messages are real-time & secure</div>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}><X size={16} /></button>
      </div>

      {/* Messages */}
      <div className="px-4 py-3" style={{ height: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={20} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs" style={{ color: 'var(--text-muted)' }}>
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map(m => {
            const isMe = m.from === user?.uid;
            return (
              <div key={m.id} className="flex flex-col" style={{ alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                {!isMe && (
                  <span className="text-[10px] font-semibold mb-1 px-1" style={{ color: 'var(--text-muted)' }}>
                    {m.senderName} ({m.role})
                  </span>
                )}
                <div style={{
                  maxWidth: '80%', padding: '8px 12px', borderRadius: '12px',
                  fontSize: '0.8125rem', lineHeight: 1.5,
                  background: isMe ? 'var(--primary)' : 'var(--bg-section)',
                  color: isMe ? 'white' : 'var(--text-primary)',
                  borderBottomRightRadius: isMe ? '4px' : '12px',
                  borderBottomLeftRadius: !isMe ? '4px' : '12px',
                }}>
                  {m.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          placeholder="Type a message..." className="flex-1"
          style={{ padding: '8px 12px', fontSize: '0.8125rem' }}
          onKeyDown={e => e.key === 'Enter' && sendMessage()} />
        <button className="btn btn-primary btn-sm" onClick={sendMessage} disabled={!input.trim()}>
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}
