'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bell, House, LogOut, MessageCircle, Trophy, User } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import TakoAssistant from '@/components/tako/TakoAssistant';
import { NotificationsService } from '@/lib/services/notificationsService';
import { ChatService } from '@/lib/services/chatService';
import { createClient } from '@/lib/supabase/client';

// The ONE navbar for the whole app (dashboard, Scout, Messages,
// Notifications, Rewards, Profile...) - exactly the home (dashboard) bar from
// the client's sketch: slim solid-gold bar, profile photo | FUZO logo (opens
// Tako, the AI food assistant) | home + bell. Home (the house icon) goes
// back to the dashboard from any page; it's lit while you're there. The photo
// opens the account menu (Profile, Leaderboard, Sign out); the bell opens Notifications + Messages with real
// unread dots. Menus are plain React state (no Bootstrap
// JS). Styles: _header.scss (.fz-topbar).

export default function SiteHeader() {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [menu, setMenu] = useState<'account' | 'inbox' | null>(null);
  const [isTakoOpen, setIsTakoOpen] = useState(false);
  const [unread, setUnread] = useState({ notifications: false, messages: 0 });

  // Real unread state, refreshed on every page change.
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    Promise.all([NotificationsService.hasUnread(user.id), ChatService.unreadTotal()]).then(([notifications, messages]) => {
      if (!cancelled) setUnread({ notifications, messages });
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id, pathname]);

  // Escape closes any open menu.
  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menu]);

  const close = () => setMenu(null);
  const toggle = (m: 'account' | 'inbox') => setMenu((cur) => (cur === m ? null : m));

  const handleSignOut = async () => {
    close();
    const supabase = createClient();
    await supabase?.auth.signOut();
    router.push('/login');
  };

  const signedIn = Boolean(user);
  const showInboxDot = signedIn && (unread.notifications || unread.messages > 0);
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const displayName = (user?.user_metadata?.display_name as string | undefined) || user?.email?.split('@')[0] || 'You';
  const onHome = pathname === '/dashboard';

  return (
    <>
      <header className="fz-topbar">
        {/* Left: profile photo -> account menu */}
        <div className="fz-topbar__side">
          {signedIn ? (
            <div className="fz-topbar__anchor">
              <button
                type="button"
                className="fz-topbar__avatar"
                aria-label="Account menu"
                aria-haspopup="menu"
                aria-expanded={menu === 'account'}
                onClick={() => toggle('account')}
              >
                {avatarUrl ? <img src={avatarUrl} alt="" /> : <span>{displayName.charAt(0).toUpperCase()}</span>}
              </button>
              {menu === 'account' && (
                <>
                  <button type="button" className="fz-topbar__scrim" aria-label="Close menu" onClick={close} />
                  <div className="fz-topbar__menu fz-topbar__menu--start" role="menu">
                    <div className="fz-topbar__menu-head">
                      <strong>{displayName}</strong>
                      <span>{user?.email}</span>
                    </div>
                    <Link href="/profile" className="fz-topbar__menu-item" role="menuitem" onClick={close}>
                      <span className="fz-topbar__menu-icon"><User size={16} /></span> Profile
                    </Link>
                    <Link href="/leaderboard" className="fz-topbar__menu-item" role="menuitem" onClick={close}>
                      <span className="fz-topbar__menu-icon"><Trophy size={16} /></span> Leaderboard
                    </Link>
                    <button type="button" className="fz-topbar__menu-item" role="menuitem" onClick={handleSignOut}>
                      <span className="fz-topbar__menu-icon"><LogOut size={16} /></span> Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : null}
        </div>

        {/* Centre: logo - opens Tako when signed in, goes home otherwise. */}
        {signedIn ? (
          <button type="button" className="fz-topbar__logo" onClick={() => { close(); setIsTakoOpen(true); }} aria-label="Ask Tako, your AI food assistant" title="Ask Tako">
            <img src="/fuzo_logo.svg" alt="FUZO" />
          </button>
        ) : (
          <Link href="/" className="fz-topbar__logo" aria-label="FUZO home">
            <img src="/fuzo_logo.svg" alt="FUZO" />
          </Link>
        )}

        {/* Right: home (back to the dashboard from anywhere) + inbox (notifications + messages). */}
        <div className="fz-topbar__side fz-topbar__side--end">
          {signedIn && (
            <Link
              href="/dashboard"
              className={`fz-topbar__icon${onHome ? ' is-current' : ''}`}
              aria-label="Home"
              aria-current={onHome ? 'page' : undefined}
              title="Home"
              onClick={close}
            >
              <House size={20} strokeWidth={2.2} />
            </Link>
          )}
          {signedIn ? (
            <div className="fz-topbar__anchor">
              <button
                type="button"
                className="fz-topbar__icon"
                aria-label="Notifications and messages"
                aria-haspopup="menu"
                aria-expanded={menu === 'inbox'}
                onClick={() => toggle('inbox')}
              >
                <Bell size={20} strokeWidth={2.2} />
                {showInboxDot && <span className="fz-topbar__dot" aria-hidden="true" />}
              </button>
              {menu === 'inbox' && (
                <>
                  <button type="button" className="fz-topbar__scrim" aria-label="Close menu" onClick={close} />
                  <div className="fz-topbar__menu" role="menu">
                    <Link href="/notifications" className="fz-topbar__menu-item" role="menuitem" onClick={close}>
                      <span className="fz-topbar__menu-icon"><Bell size={16} /></span>
                      Notifications
                      {unread.notifications && <span className="fz-topbar__menu-badge">New</span>}
                    </Link>
                    <Link href="/messages" className="fz-topbar__menu-item" role="menuitem" onClick={close}>
                      <span className="fz-topbar__menu-icon"><MessageCircle size={16} /></span>
                      Messages
                      {unread.messages > 0 && <span className="fz-topbar__menu-badge">{unread.messages > 99 ? '99+' : unread.messages}</span>}
                    </Link>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link href="/login" className="fz-topbar__signin">Sign in</Link>
          )}
        </div>
      </header>

      {signedIn && <TakoAssistant variant="overlay" isOpen={isTakoOpen} onClose={() => setIsTakoOpen(false)} />}
    </>
  );
}
