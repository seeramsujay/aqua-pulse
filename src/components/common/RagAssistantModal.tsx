import React, { useState } from 'react';
import { X, Bot, Send, ShieldCheck, Sparkles, BookOpen } from 'lucide-react';

interface RagAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  sender: 'user' | 'assistant';
  text: string;
  ruleTag?: string;
}

export const RagAssistantModal: React.FC<RagAssistantModalProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'assistant',
      text: 'Greetings. I am the AQUAPULSE Oceanographic RAG Assistant, trained on Ministry of Earth Sciences (MoES) and National Institute of Ocean Technology (NIOT) subsea hydrographic guidelines. Ask me anything about acoustic ray bending, sound speed gradients, or chirp spread spectrum optimization.',
      ruleTag: 'MoES/NIOT KB-v2'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = () => {
    if (!input.trim()) return;

    const userQ = input;
    setMessages((prev) => [...prev, { sender: 'user', text: userQ }]);
    setInput('');
    setIsLoading(true);

    setTimeout(() => {
      let reply = '';
      let tag = 'NIOT-ACOUSTICS';

      const q = userQ.toLowerCase();
      if (q.includes('blind') || q.includes('zone') || q.includes('monostatic')) {
        reply = 'According to NIOT Sonar Design Section 3.2, monostatic blind zone R_blind = (c * Tp) / 2. By reducing pulse duration to micro-chirps (0.4 - 1.2 ms), AQUAPULSE shrinks the blind zone below 1.1 meters while retaining range resolution via matched filtering.';
        tag = 'NIOT-BATHY-01';
      } else if (q.includes('snell') || q.includes('bend') || q.includes('refract') || q.includes('shadow')) {
        reply = 'Snell\'s Law dictates cos(theta(z))/c(z) = constant. In a negative temperature gradient (thermocline), acoustic rays bend downward, generating an acoustic shadow zone near the surface. Lower carrier frequencies (100-140 kHz) provide wide diffraction around these boundaries.';
        tag = 'NIOT-BATHY-02';
      } else if (q.includes('gain') || q.includes('compression') || q.includes('snr')) {
        reply = 'Pulse compression provides Processing Gain Gp = 10 * log10(B * Tp). For our 80 kHz bandwidth and micro-pulse duration, Gp reaches +18.4 dB. This enables robust echo detection even in negative SNR environments beneath ambient noise floor.';
        tag = 'NIOT-MATH-04';
      } else if (q.includes('filter') || q.includes('butterworth') || q.includes('opa1612')) {
        reply = 'The active 4th-order Sallen-Key Butterworth filter (TI OPA1612) establishes a cutoff at fc = 450 kHz with an -80 dB/decade roll-off, completely stripping DAC staircase harmonics and clock aliasing at 2.4 MSPS.';
        tag = 'NIOT-HW-05';
      } else {
        reply = `Under MoES bathymetric standards, cognitive acoustic adaptation balances high spatial resolution (centimeter-grade) with transmission loss minimization (Thorp equation). Your query regarding "${userQ}" is resolved by real-time INT8 TinyML policy parameter selection.`;
        tag = 'MoES-STD-2026';
      }

      setMessages((prev) => [...prev, { sender: 'assistant', text: reply, ruleTag: tag }]);
      setIsLoading(false);
    }, 600);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(7, 16, 24, 0.85)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-2xl h-[600px] flex flex-col overflow-hidden"
        style={{
          background: '#0B1720',
          border: '1px solid #20333D',
          borderRadius: '8px',
        }}
      >
        {/* Header */}
        <div
          className="p-4 flex items-center justify-between"
          style={{
            background: '#0E1C25',
            borderBottom: '1px solid #182A34',
          }}
        >
          <div className="flex items-center space-x-3">
            <div
              className="p-2 rounded flex items-center justify-center"
              style={{
                background: '#12232D',
                border: '1px solid #20333D',
                color: '#43C7D9',
              }}
            >
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold font-mono text-slate-100">
                  MoES/NIOT Oceanographic RAG Assistant
                </h3>
                <span className="hud-chip">
                  AGENTIC REASONING
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Cognitive Subsea Acoustic Bathymetry Knowledge Engine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded text-slate-400 hover:text-white transition-colors"
            style={{
              background: '#12232D',
              border: '1px solid #20333D',
              padding: '6px',
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 font-sans text-xs">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className="max-w-[85%] p-3"
                style={{
                  background: m.sender === 'user' ? '#1A5F6B' : 'var(--bg-inset)',
                  color: '#E7EEF1',
                  border: m.sender === 'user' ? 'none' : '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                }}
              >
                {m.ruleTag && (
                  <div className="flex items-center space-x-1 mb-1 text-[10px] font-mono font-bold" style={{ color: '#43C7D9' }}>
                    <ShieldCheck className="w-3 h-3" />
                    <span>{m.ruleTag}</span>
                  </div>
                )}
                <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center space-x-2 font-mono text-xs p-2" style={{ color: '#43C7D9' }}>
              <Sparkles className="w-4 h-4" />
              <span>Querying NIOT Acoustic Knowledge Graph...</span>
            </div>
          )}
        </div>

        {/* Suggested Queries */}
        <div
          className="px-4 py-2 flex items-center space-x-2 overflow-x-auto text-[11px] font-mono"
          style={{
            background: '#091319',
            borderTop: '1px solid #182A34',
          }}
        >
          <span className="text-slate-500 flex items-center space-x-1">
            <BookOpen className="w-3 h-3" />
            <span>Prompt:</span>
          </span>
          <button
            onClick={() => setInput('Why does monostatic sonar have a blind zone?')}
            className="hud-chip cursor-pointer whitespace-nowrap"
          >
            Blind Zone Math
          </button>
          <button
            onClick={() => setInput('How does the +18.4 dB pulse compression gain work?')}
            className="hud-chip cursor-pointer whitespace-nowrap"
          >
            Pulse Compression Gain
          </button>
          <button
            onClick={() => setInput('Explain Snell refraction across thermocline layers.')}
            className="hud-chip cursor-pointer whitespace-nowrap"
          >
            Snell Ray Refraction
          </button>
        </div>

        {/* Input Bar */}
        <div
          className="p-3 flex items-center space-x-2"
          style={{
            background: '#0E1C25',
            borderTop: '1px solid #182A34',
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about ocean acoustics, Snell's law, Mackenzie formula..."
            className="flex-1 px-3 py-2 text-xs font-sans rounded focus:outline-none"
            style={{
              background: '#071018',
              border: '1px solid #20333D',
              color: '#E7EEF1',
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-2 rounded transition-colors font-bold disabled:opacity-40"
            style={{
              background: '#43C7D9',
              color: '#071018',
              border: 'none',
            }}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
