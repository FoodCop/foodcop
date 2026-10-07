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
 *     starts. Every option does something real (navigate or start a real
 *     chat), and its chat submission (which called a GeminiService.askTako
 *     method that doesn't exist anywhere) was dropped in favor of the proven
 *     structured-schema flow.
 *
 * Rendered as an overlay, opened from the FUZO logo in the app navbar
 * (SiteHeader); the `variant="page"` layout is kept for a full-page use.
 *
 * Landing redesign (client, 2026-10-07: "more animated / modern, a 3D mascot
 * face, 3 options first, the rest open below, a search bar"): Tako's animated
 * face (TakoMascot) with a speech bubble, the ask/search bar, then three big
 * starting points - Eat out / Cook / Explore (TAKO_GROUPS). Picking one makes
 * Tako hop and opens that group's options in a card underneath; picking
 * another swaps them, picking it again closes them.
 */

import { useState, useEffect, useRef, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUp, ChefHat, ChevronDown, RotateCcw, Search, Sparkles, UtensilsCrossed, X, type LucideIcon } from 'lucide-react';
import { GeminiService } from '@/lib/services/geminiService';
import { CHEF_SUGGESTED_PROMPTS, CHEF_SYSTEM_INSTRUCTION, CHEF_RESPONSE_SCHEMA, TAKO_GROUPS, getGreeting } from '@/lib/tako/prompts';
import type { ChatMessage, ChefStructuredResponse, TakoAction, TakoGroup } from '@/types/tako';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { CreateCardModal } from '@/components/create/CreateCardModal';
import { TakoMascot, type TakoMood } from './TakoMascot';

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

const GROUP_ICONS: Record<TakoGroup['id'], LucideIcon> = {
  eat: UtensilsCrossed,
  cook: ChefHat,
  explore: Sparkles,
};

const EASE = [0.16, 1, 0.3, 1] as const;

interface TakoAssistantProps {
  variant: 'overlay' | 'page';
  isOpen?: boolean;
  onClose?: () => void;
}

export default function TakoAssistant({ variant, isOpen = true, onClose }: TakoAssistantProps) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<'landing' | 'chat'>('landing');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCreateCardOpen, setIsCreateCardOpen] = useState(false);
  const [openGroupId, setOpenGroupId] = useState<TakoGroup['id'] | null>(null);
  const [mood, setMood] = useState<TakoMood>('idle');
  const [searchFocused, setSearchFocused] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const moodTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trapRef = useFocusTrap(variant === 'overlay' && isOpen);

  useEffect(() => {
    if (variant !== 'overlay') return;
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [variant, isOpen]);

  // Escape closes the overlay.
  useEffect(() => {
    if (variant !== 'overlay' || !isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [variant, isOpen, onClose]);

  useEffect(() => {
    return () => { if (moodTimer.current) clearTimeout(moodTimer.current); };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const greeting = getGreeting();

  // A quick happy hop whenever you pick something.
  const cheer = () => {
    setMood('happy');
    if (moodTimer.current) clearTimeout(moodTimer.current);
    moodTimer.current = setTimeout(() => setMood('idle'), 900);
  };

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
      setMessages(prev => [...prev, { role: 'ai', text: "I couldn't reach the kitchen. Check your connection and try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const startChat = (text: string) => {
    setPhase('chat');
    setInput('');
    setMessages([{ role: 'ai', text: "Tako here! Let's find you something tasty." }]);
    sendMessage(text);
  };

  const backToLanding = () => {
    setPhase('landing');
    setMessages([]);
    setInput('');
  };

  const toggleGroup = (id: TakoGroup['id']) => {
    cheer();
    setOpenGroupId((current) => (current === id ? null : id));
  };

  const runAction = (action: TakoAction) => {
    if (action.type === 'navigate') {
      router.push(action.href);
      onClose?.();
    } else if (action.type === 'prompt') {
      startChat(action.prompt);
    } else {
      setIsCreateCardOpen(true);
    }
  };

  const openGroup = TAKO_GROUPS.find((g) => g.id === openGroupId) ?? null;
  // The mascot only runs while Tako is on screen (the overlay stays mounted
  // when closed), and it remounts on each open so it waves hello again.
  const visible = variant === 'page' || isOpen;
  const rise = (delay: number) =>
    reduceMotion
      ? {}
      : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay, ease: EASE } };

  return (
    <>
    <div
      ref={variant === 'overlay' ? trapRef : undefined}
      role={variant === 'overlay' ? 'dialog' : undefined}
      aria-modal={variant === 'overlay' ? true : undefined}
      aria-label={variant === 'overlay' ? 'Tako, your food assistant' : undefined}
      className={`tako-shell tako-shell--${variant}${variant === 'overlay' && isOpen ? ' is-open' : ''}`}
    >
      <div className="tako-shell__header">
        {phase === 'chat' && (
          <div className="tako-chat__who">
            {visible && <TakoMascot size={48} mood={loading ? 'thinking' : 'idle'} />}
            <div>
              <div className="tako-chat__name">Tako</div>
              <div className="tako-chat__status" aria-live="polite">{loading ? 'Thinking…' : 'Your food buddy'}</div>
            </div>
          </div>
        )}
        <div className="tako-shell__actions">
          {phase === 'chat' && (
            <button type="button" className="tako-chat__back" onClick={backToLanding}>
              <RotateCcw size={15} /> New chat
            </button>
          )}
          {variant === 'overlay' && (
            <button type="button" className="tako-close" onClick={onClose} aria-label="Close Tako">
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      <div className="tako-body">
        {phase === 'landing' ? (
          <div className="tako-landing">
            <section className="tako-hero">
              <div className="tako-hero__stage">
                {visible && (
                  <>
                    <TakoMascot mood={mood} size={176} lookAt={searchFocused ? { x: 0, y: 1 } : null} />
                    <motion.div
                      className="tako-hero__bubble"
                      initial={reduceMotion ? false : { opacity: 0, scale: 0.8, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.45, delay: 0.5, ease: EASE }}
                    >
                      <strong>{greeting.title}</strong> {greeting.sub}
                    </motion.div>
                  </>
                )}
              </div>
              <motion.h2 className="tako-hero__title" {...rise(0.1)}>Hi, I&apos;m Tako</motion.h2>
              <motion.p className="tako-hero__sub" {...rise(0.16)}>Your food buddy. Ask me anything, or pick where to start.</motion.p>
            </section>

            <motion.form
              className="tako-search"
              role="search"
              onSubmit={(e) => { e.preventDefault(); if (input.trim()) startChat(input); }}
              {...rise(0.22)}
            >
              <Search size={18} aria-hidden="true" />
              <input
                type="text"
                className="tako-search__input"
                placeholder="Ask or search anything food…"
                aria-label="Ask Tako"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
              />
              <button type="submit" className="tako-search__send" disabled={!input.trim()} aria-label="Ask Tako">
                <ArrowUp size={18} strokeWidth={2.6} />
              </button>
            </motion.form>

            <div className="tako-picks" role="group" aria-label="Where to start">
              {TAKO_GROUPS.map((g, i) => {
                const Icon = GROUP_ICONS[g.id];
                const open = openGroupId === g.id;
                return (
                  <motion.button
                    key={g.id}
                    type="button"
                    className={`tako-pick${open ? ' is-open' : ''}`}
                    aria-expanded={open}
                    aria-controls="tako-options"
                    onClick={() => toggleGroup(g.id)}
                    whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                    {...rise(0.28 + i * 0.07)}
                  >
                    <span
                      className="tako-pick__ball"
                      style={{ '--tako-from': g.tint[0], '--tako-to': g.tint[1] } as CSSProperties}
                      aria-hidden="true"
                    >
                      <Icon size={24} strokeWidth={2.2} />
                    </span>
                    <span className="tako-pick__label">{g.label}</span>
                    <span className="tako-pick__sub">{g.sub}</span>
                    <ChevronDown className="tako-pick__chev" size={16} strokeWidth={2.6} aria-hidden="true" />
                  </motion.button>
                );
              })}
            </div>

            <AnimatePresence mode="wait" initial={false}>
              {openGroup && (
                <motion.div
                  key={openGroup.id}
                  id="tako-options"
                  className="tako-options"
                  role="region"
                  aria-label={`${openGroup.label} ideas`}
                  initial={reduceMotion ? false : { opacity: 0, y: -10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  // On phones the options can open below the fold: bring them into view.
                  onAnimationComplete={() => {
                    document.getElementById('tako-options')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
                  }}
                >
                  <div className="tako-options__grid">
                    {openGroup.options.map((o, i) => (
                      <motion.button
                        key={o.label}
                        type="button"
                        className="tako-option"
                        onClick={() => runAction(o.action)}
                        initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.94 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.35, delay: 0.05 + i * 0.04, ease: EASE }}
                        whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                      >
                        <span className="tako-option__icon" aria-hidden="true"><img src={o.icon} alt="" /></span>
                        <span className="tako-option__label">{o.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <>
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
                          <div className="tako-ai-card__icon"><TakoMascot size={34} still /></div>
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
                    <div className="tako-ai-card__icon"><TakoMascot size={34} still /></div>
                    <div className="tako-msg__bubble">{m.text}</div>
                  </div>
                );
              })}
              {loading && (
                <div className="tako-typing" aria-label="Tako is typing">
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
            placeholder="Ask Tako…"
            aria-label="Message Tako"
          />
          <button type="button" className="tako-footer__send" onClick={() => sendMessage()} disabled={loading || !input.trim()} aria-label="Send">
            <ArrowUp size={20} strokeWidth={2.6} />
          </button>
        </footer>
      )}
    </div>
    {isCreateCardOpen && createPortal(
      <CreateCardModal onClose={() => { setIsCreateCardOpen(false); onClose?.(); }} />,
      document.body,
    )}
    </>
  );
}
