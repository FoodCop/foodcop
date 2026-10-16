import { ExternalLink } from 'lucide-react';
import { PLATFORM_LABEL, parseSourceUrl, type ImportPlatform } from '@/lib/import/platforms';

// "From @creator on TikTok · Open original" for imported posts (URL import,
// client 2026-10-16). The link opens the original post in a new tab.

interface SourceCreditProps {
  url: string;
  platform?: ImportPlatform | null;
  author?: string | null;
  className?: string;
}

export function SourceCredit({ url, platform, author, className = '' }: SourceCreditProps) {
  const parsed = parseSourceUrl(url);
  if (!parsed) return null;
  const kind = platform ?? parsed.platform;
  // Websites are named by their address; social posts by the creator and the app.
  const from =
    kind === 'web'
      ? `${new URL(parsed.url).hostname.replace(/^www\./, '')}${author ? ` · by ${author}` : ''}`
      : author
        ? `${author} on ${PLATFORM_LABEL[kind]}`
        : PLATFORM_LABEL[kind];
  return (
    <p className={`fz-source-credit ${className}`}>
      <span>Imported from {from}</span>
      <a href={parsed.url} target="_blank" rel="noopener noreferrer nofollow">
        Open original <ExternalLink size={13} aria-hidden="true" />
      </a>
    </p>
  );
}

export default SourceCredit;
