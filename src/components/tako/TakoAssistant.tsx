'use client';

/**
 * ============================================================================
 * TAKO ASSISTANT — Landing screen + structured AI chat (Next.js Port)
 * ============================================================================
 *
 * Combines two legacy sources:
 *   - legacy/fuzoapp/src/features/chef/components/ChefAIView.tsx: the chat
 *     engine (structured Gemini JSON responses - bullets/cards/actions/
 *     suggestions), used as-is for the conversation half.
 *   - FUZO_V3/js/tako.js: the landing screen shown before a conversation
 *     starts (greeting, search, food moods, quick discovery grid). Every
 *     mood/quick-action now does something real (navigate or start a real
 *     chat) instead of tako.js's toast-only stubs, and its chat submission
 *     (which called a GeminiService.askTako method that doesn't exist
 *     anywhere) was dropped in favor of the proven structured-schema flow.
 *
 * Rendered by both TakoWidget (floating overlay) and the /ai-chef page,
 * via the `variant` prop.
 */

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, Send, X, Search, ArrowLeft } from 'lucide-react';
import { GeminiService } from '@/lib/services/geminiService';
import { CHEF_SUGGESTED_PROMPTS, CHEF_SYSTEM_INSTRUCTION, CHEF_RESPONSE_SCHEMA, MOODS, QUICK_ACTIONS, QUICK_LINKS, getGreeting } from '@/lib/tako/prompts';
import type { ChatMessage, ChefStructuredResponse, QuickAction } from '@/types/tako';
import { useFocusTrap } from '@/hooks/useFocusTrap';

const parseChefResponse = (text: string): ChefStructuredResponse | null => {
  if (!text) return null;
  const trimmed = text.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null;
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === 'object' && typeof parsed.speech === 'string') {
      return parsed as ChefStructuredResponse;
    }
  } catch {
    try {
      const match = trimmed.match(/^```json\s*([\s\S]*?)\s*```$/);
      if (match?.[1]) {
        const parsed = JSON.parse(match[1].trim());
        if (parsed && typeof parsed === 'object' && typeof parsed.speech === 'string') {
          return parsed as ChefStructuredResponse;
        }
      }
    } catch {
      // Ignored - falls back to plain text rendering
    }
  }
  return null;
};

interface TakoAssistantProps {
  variant: 'overlay' | 'page';
  isOpen?: boolean;
  onClose?: () => void;
}

export default function TakoAssistant({ variant, isOpen = true, onClose }: TakoAssistantProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<'landing' | 'chat'>('landing');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trapRef = useFocusTrap(variant === 'overlay' && isOpen);

  useEffect(() => {
    if (variant !== 'overlay') return;
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [variant, isOpen]);

  const greeting = getGreeting();

  const showNotice = (msg: string) => {
    setNotice(msg);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 2200);
  };

  useEffect(() => {
    return () => { if (noticeTimer.current) clearTimeout(noticeTimer.current); };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (overrideText?: string) => {
    if (loading) return;
    const outgoing = (overrideText ?? input).trim();
    if (!outgoing) return;
    if (!overrideText) setInput('');
    setMessages(prev => [...prev, { role: 'user', text: outgoing }]);
    setLoading(true);

    try {
      const res = await GeminiService.generateContent({
        model: 'gemini-2.5-flash',
        contents: outgoing,
        config: {
          systemInstruction: CHEF_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: CHEF_RESPONSE_SCHEMA,
        },
      });

      if (res.success && res.data?.text) {
        setMessages(prev => [...prev, { role: 'ai', text: res.data.text }]);
      } else {
        throw new Error(!res.success ? res.error : 'Gemini unavailable');
      }
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: 'Studio signal weak. Check connection.' }]);
    } finally {
      setLoading(false);
    }
  };

  const startChat = (text: string) => {
    setPhase('chat');
    setMessages([{ role: 'ai', text: 'Chef FUZO here. What culinary secrets shall we unlock?' }]);
    sendMessage(text);
  };

  const backToLanding = () => {
    setPhase('landing');
    setMessages([]);
    setInput('');
  };

  const handleQuickAction = (action: QuickAction) => {
    if (action.type === 'navigate') {
      router.push(action.href);
      onClose?.();
    } else if (action.type === 'prompt') {
      startChat(action.prompt);
    } else {
      showNotice(`${action.label} is coming soon.`);
    }
  };

  const handleLink = (link: { type: 'navigate' | 'prompt'; href?: string; prompt?: string }) => {
    if (link.type === 'navigate' && link.href) {
      router.push(link.href);
      onClose?.();
    } else if (link.type === 'prompt' && link.prompt) {
      startChat(link.prompt);
    }
  };

  return (
    <div
      ref={variant === 'overlay' ? trapRef : undefined}
      role={variant === 'overlay' ? 'dialog' : undefined}
      aria-modal={variant === 'overlay' ? true : undefined}
      className={`tako-shell tako-shell--${variant}${variant === 'overlay' && isOpen ? ' is-open' : ''}`}
    >
      {variant === 'overlay' && (
        <div className="tako-shell__header">
          <button className="tako-close" onClick={onClose} aria-label="Close Tako">
            <X size={18} />
          </button>
        </div>
      )}

      <div className="tako-body">
        {phase === 'landing' ? (
          <>
            <div className="tako-greeting">
              <div className="tako-greeting__icon"><Bot size={28} /></div>
              <div className="tako-greeting__title">{greeting.title}</div>
              <div className="tako-greeting__sub">{greeting.sub}</div>
            </div>

            <div className="tako-search-wrap">
              <div className="tako-search">
                <Search size={18} />
                <input
                  type="text"
                  className="tako-search__input"
                  placeholder="Ask or search anything food..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && input.trim()) startChat(input); }}
                />
              </div>
            </div>

            <div className="tako-section-title">Food Mood</div>
            <div className="tako-moods">
              {MOODS.map((m) => (
                <button key={m.label} type="button" className="tako-mood-pill" onClick={() => startChat(m.prompt)}>
                  <img src={m.icon} alt="" className="tako-mood-pill__icon" />
                  <span>{m.label}</span>
                </button>
              ))}
            </div>

            <div className="tako-section-title">Quick Discovery</div>
            <div className="tako-quick-grid">
              {QUICK_ACTIONS.map((a) => (
                <button key={a.label} type="button" className="tako-quick-card" onClick={() => handleQuickAction(a)}>
                  <div className="tako-quick-icon" style={{ background: a.color }}>
                    <img src={a.icon} alt="" />
                  </div>
                  <div className="tako-quick-label">{a.label}</div>
                </button>
              ))}
            </div>

            <div className="tako-section-title">Quick Links</div>
            <div className="tako-links-grid">
              {QUICK_LINKS.map((l) => (
                <button key={l.label} type="button" className="tako-link-card" onClick={() => handleLink(l)}>
                  <div className="tako-link-card__icon" style={{ background: l.color }}><img src={l.icon} alt="" /></div>
                  <div className="tako-link-card__label">{l.label}</div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <button type="button" className="tako-chat__back" onClick={backToLanding}>
              <ArrowLeft size={14} /> New chat
            </button>

            <div className="tako-chat__suggested">
              {CHEF_SUGGESTED_PROMPTS.map((prompt) => (
                <button key={prompt} type="button" className="tako-suggested-chip" onClick={() => sendMessage(prompt)}>
                  {prompt}
                </button>
              ))}
            </div>

            <div className="tako-msgs">
              {messages.map((m, idx) => {
                if (m.role === 'user') {
                  return (
                    <div key={`user-${idx}`} className="tako-msg--user">
                      <div className="tako-msg__bubble">{m.text}</div>
                    </div>
                  );
                }

                const parsed = parseChefResponse(m.text);
                if (parsed) {
                  return (
                    <div key={`ai-${idx}`} className="tako-msg--ai">
                      <div className="tako-ai-card">
                        <div className="tako-ai-card__header">
                          <div className="tako-ai-card__icon"><Bot size={16} /></div>
                          <p className="tako-ai-card__speech">{parsed.speech}</p>
                        </div>

                        {parsed.bullets && parsed.bullets.length > 0 && (
                          <div className="tako-ai-card__bullets">
                            {parsed.bullets.map((bullet, bIdx) => (
                              <div key={bIdx} className="tako-ai-card__bullet">{bullet}</div>
                            ))}
                          </div>
                        )}

                        {parsed.cards && parsed.cards.length > 0 && (
                          <div className="tako-ai-card__grid">
                            {parsed.cards.map((card, cIdx) => (
                              <button key={cIdx} type="button" className="tako-ai-card__option" onClick={() => sendMessage(card.suggestion)}>
                                <span className="tako-ai-card__option-title">{card.title}</span>
                                <span className="tako-ai-card__option-desc">{card.description}</span>
                                {card.meta && <span className="tako-ai-card__option-meta">{card.meta}</span>}
                              </button>
                            ))}
                          </div>
                        )}

                        {parsed.actions && parsed.actions.length > 0 && (
                          <div className="tako-ai-card__actions">
                            {parsed.actions.map((act, aIdx) => (
                              <button key={aIdx} type="button" className="tako-action-btn" onClick={() => sendMessage(act.command)}>
                                {act.label}
                              </button>
                            ))}
                          </div>
                        )}

                        {parsed.suggestions && parsed.suggestions.length > 0 && (
                          <div className="tako-ai-card__suggestions">
                            {parsed.suggestions.map((sug, sIdx) => (
                              <button key={sIdx} type="button" className="tako-suggestion-chip" onClick={() => sendMessage(sug)}>
                                {sug}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={`ai-fallback-${idx}`} className="tako-msg--ai">
                    <div className="tako-msg__bubble">{m.text}</div>
                  </div>
                );
              })}
              {loading && (
                <div className="tako-typing">
                  <div className="tako-typing__dot" />
                  <div className="tako-typing__dot" />
                  <div className="tako-typing__dot" />
                </div>
              )}
              <div ref={endRef} />
            </div>
          </>
        )}
      </div>

      {phase === 'chat' && (
        <footer className="tako-footer">
          <input
            className="tako-footer__input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Consult the Chef..."
          />
          <button className="tako-footer__send" onClick={() => sendMessage()} disabled={loading || !input.trim()}>
            <Send size={20} />
          </button>
        </footer>
      )}

      {notice && (
        <div style={{ position: 'absolute', bottom: phase === 'chat' ? 96 : 24, left: '50%', transform: 'translateX(-50%)', background: '#1c1917', color: '#fff', padding: '10px 20px', borderRadius: 999, fontSize: 12, fontWeight: 700, boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
          {notice}
        </div>
      )}
    </div>
  );
}
