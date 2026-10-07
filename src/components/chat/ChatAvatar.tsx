'use client';

import { useState } from 'react';
import { Users } from 'lucide-react';
import { initialsOf, tintFor } from '@/lib/chat/format';

// The user's own photo, or a tinted-initials circle. Never a placeholder-photo
// service (the old chat pulled random faces from a third-party host and sent it
// every user's id).
export default function ChatAvatar({
  id,
  name,
  src,
  size = 48,
  online = false,
  group = false,
}: {
  id: string;
  name: string;
  src: string | null;
  size?: number;
  online?: boolean;
  group?: boolean;
}) {
  const [broken, setBroken] = useState(false);
  const style = { width: size, height: size, fontSize: size * 0.36 } as const;

  return (
    <span className="fz-chat-avatar" style={{ width: size, height: size }}>
      {src && !broken ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="fz-chat-avatar__img" style={style} src={src} alt="" onError={() => setBroken(true)} />
      ) : (
        <span className="fz-chat-avatar__img fz-chat-avatar__img--initials" style={{ ...style, background: tintFor(id) }} aria-hidden>
          {group ? <Users size={size * 0.42} /> : initialsOf(name)}
        </span>
      )}
      {online && <span className="fz-chat-avatar__online" aria-label="Active now" />}
    </span>
  );
}
