import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, X, Send, Stethoscope, Loader2, AlertTriangle } from 'lucide-react';
import { genAI } from '../lib/gemini';

export default function TriageAgentUI({ triggerSOS }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'model', text: "Hi, I'm the MediPath Triage Assistant. How are you feeling today? If it's a medical emergency, please say so!" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  // Initialize chat session once when chat opens
  const chatSessionRef = useRef(null);

  useEffect(() => {
    if (isOpen && !chatSessionRef.current) {
      try {
        const model = genAI.getGenerativeModel({
          model: 'gemini-2.5-flash',
          systemInstruction: "You are the MediPath Emergency Triage Agent. You are a helpful, very brief, and professional AI medical assistant. Ask the user for their symptoms. If the symptoms are mild/moderate, call the navigate_to_doctor tool. If the symptoms indicate a life-threatening emergency (e.g. chest pain, heart attack, unable to breathe, massive bleeding), you MUST call the trigger_emergency_sos tool.",
          tools: [{
            functionDeclarations: [
              {
                name: "trigger_emergency_sos",
                description: "Trigger the emergency SOS protocol if the patient is experiencing a life-threatening medical emergency.",
              },
              {
                name: "navigate_to_doctor",
                description: "Help the user find a doctor and book an appointment for their mild or moderate symptoms.",
              }
            ]
          }]
        });
        chatSessionRef.current = model.startChat({ history: [] });
      } catch (error) {
        console.error("Failed to initialize Gemini:", error);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      if (!chatSessionRef.current) {
         setMessages(prev => [...prev, { role: 'model', text: "Error: AI not initialized. Check your API key." }]);
         setIsLoading(false);
         return;
      }

      const result = await chatSessionRef.current.sendMessage(userMessage);
      const calls = result.response.functionCalls();

      if (calls && calls.length > 0) {
        const call = calls[0];
        if (call.name === 'trigger_emergency_sos') {
          triggerSOS();
          setMessages(prev => [...prev, { role: 'model', text: "🚨 I have detected a potential emergency! I am triggering the SOS alert right now. Please hold on or call local emergency services immediately!" }]);
        } else if (call.name === 'navigate_to_doctor') {
          navigate('/patient/match');
          setMessages(prev => [...prev, { role: 'model', text: "Taking you to the Doctor Matcher now to find the right specialist for these symptoms..." }]);
          setTimeout(() => setIsOpen(false), 2000);
        }
      } else {
        const text = result.response.text();
        setMessages(prev => [...prev, { role: 'model', text: text }]);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: "I'm sorry, I'm having trouble connecting right now." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fade-in"
          style={{
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            width: '60px',
            height: '60px',
            borderRadius: '30px',
            background: 'linear-gradient(135deg, var(--primary) 0%, #7C3AED 100%)',
            color: 'white',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 30px rgba(79,70,229,0.4)',
            cursor: 'pointer',
            zIndex: 1000,
            transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <MessageSquare size={28} />
          {/* Quick notification badge */}
          <div style={{
            position: 'absolute', top: 0, right: 0, width: 14, height: 14, background: 'var(--danger)',
            borderRadius: '50%', border: '2px solid white'
          }} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div 
          className="fade-in"
          style={{
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            width: '350px',
            height: '500px',
            maxHeight: '80vh',
            background: 'var(--bg)',
            borderRadius: '24px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
            border: '1px solid var(--border)',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            background: 'linear-gradient(135deg, var(--primary) 0%, #7C3AED 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ background: 'white', padding: 6, borderRadius: '50%' }}>
                <Stethoscope size={18} color="var(--primary)" />
              </div>
              <div style={{ fontWeight: 'bold' }}>Triage Agent</div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.8 }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ 
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%'
              }}>
                <div style={{
                  background: msg.role === 'user' ? 'var(--primary)' : 'var(--bg-section)',
                  color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                  padding: '12px 16px',
                  borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  fontSize: '0.9rem',
                  lineHeight: 1.5,
                  boxShadow: 'var(--shadow-sm)',
                  border: msg.role === 'model' ? '1px solid var(--border)' : 'none'
                }}>
                  {msg.text.includes('🚨') && <AlertTriangle size={16} style={{ display: 'inline', marginBottom: -3, marginRight: 6 }} />}
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={{ alignSelf: 'flex-start', background: 'var(--bg-section)', padding: '12px 16px', borderRadius: '18px 18px 18px 4px' }}>
                <Loader2 size={18} color="var(--primary)" className="animate-spin" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{ padding: '16px', borderTop: '1px solid var(--border)', background: 'white' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Describe your symptoms..."
                style={{ flex: 1, padding: '12px 16px', borderRadius: '40px', border: '1px solid var(--border)', outline: 'none' }}
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                style={{
                  width: '44px', height: '44px', borderRadius: '50%',
                  background: input.trim() && !isLoading ? 'var(--primary)' : '#e5e7eb',
                  color: 'white', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                  transition: 'background 0.2s'
                }}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
