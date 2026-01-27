import type { ReactNode } from 'react';
import { cn } from '../../utils';

interface SidebarPanelProps {
  eyebrow?: string;
  title?: string;
  action?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Use full-height style matching Scout/Plate (no rounded corners, full height) */
  fullHeight?: boolean;
  /** Theme color for the sidebar (defaults to white) */
  themeColor?: 'pineapple' | 'apricot' | 'dark-mango' | 'blood-orange' | 'candy-apple' | 'white' | 'vibrant-pink';
}

interface SidebarSectionProps {
  eyebrow?: string;
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

// Theme color mapping
const themeColors = {
  pineapple: { bg: '#eda600', text: '#FFFFFF', border: '#d99600' },
  apricot: { bg: '#F5C89A', text: '#0f172a', border: '#E5B88A' },
  'dark-mango': { bg: '#D55123', text: '#FFFFFF', border: '#C54113' },
  'blood-orange': { bg: '#BF2C20', text: '#FFFFFF', border: '#AF1C10' },
  'candy-apple': { bg: '#951A21', text: '#FFFFFF', border: '#850A11' },
  'vibrant-pink': { bg: '#ac0039', text: '#FFFFFF', border: '#E5B88A' },
  white: { bg: '#FFFFFF', text: '#0f172a', border: '#EEE' },
};

export function SidebarPanel({
  eyebrow,
  title,
  action,
  footer,
  children,
  className,
  fullHeight = false,
  themeColor = 'white',
}: SidebarPanelProps) {
  const colors = themeColors[themeColor];
  const isColored = themeColor !== 'white' && themeColor !== 'apricot';
  const isLightBg = themeColor === 'white' || themeColor === 'apricot';

  // Full-height style: matches Scout sidebar (border-r, no rounded corners, full height)
  if (fullHeight) {
    return (
      <aside
        className={cn(
          'w-[280px] border-r flex flex-col h-full',
          className
        )}
        style={{
          backgroundColor: colors.bg,
          borderColor: colors.border,
        }}
        aria-label={title ?? 'Sidebar'}
      >
        {/* Header */}
        {(eyebrow || title || action) && (
          <div
            className="p-4 border-b"
            style={{ borderColor: isLightBg ? '#f3f4f6' : 'rgba(255,255,255,0.2)' }}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                {eyebrow && (
                  <p
                    className="text-[11px] font-semibold uppercase tracking-[0.3em]"
                    style={{ color: isLightBg ? '#8A8A8A' : 'rgba(255,255,255,0.7)' }}
                  >
                    {eyebrow}
                  </p>
                )}
                {title && (
                  <h3
                    className="text-lg font-bold"
                    style={{ color: colors.text }}
                  >
                    {title}
                  </h3>
                )}
              </div>
              {action}
            </div>
          </div>
        )}

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">{children}</div>

        {/* Footer */}
        {footer && (
          <div
            className="p-4 border-t"
            style={{ borderColor: isLightBg ? '#f3f4f6' : 'rgba(255,255,255,0.2)' }}
          >
            {footer}
          </div>
        )}
      </aside>
    );
  }

  // Card style (original)
  return (
    <aside className={cn('w-80 flex-shrink-0', className)} aria-label={title ?? 'Sidebar'}>
      <div className="sticky top-6">
        <div
          className="border rounded-3xl shadow-sm p-6 flex flex-col gap-6"
          style={{
            backgroundColor: colors.bg,
            borderColor: colors.border,
          }}
        >
          {(eyebrow || title || action) && (
            <div className="flex items-center justify-between gap-3">
              <div>
                {eyebrow && (
                  <p
                    className="text-[11px] font-semibold uppercase tracking-[0.3em]"
                    style={{ color: isLightBg ? '#8A8A8A' : 'rgba(255,255,255,0.7)' }}
                  >
                    {eyebrow}
                  </p>
                )}
                {title && (
                  <h3
                    className="text-2xl font-bold"
                    style={{ color: colors.text }}
                  >
                    {title}
                  </h3>
                )}
              </div>
              {action}
            </div>
          )}

          <div className="space-y-6">{children}</div>

          {footer && (
            <div
              className="pt-4 border-t"
              style={{ borderColor: isLightBg ? '#EEE' : 'rgba(255,255,255,0.2)' }}
            >
              {footer}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

export function SidebarSection({
  eyebrow,
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}: SidebarSectionProps) {
  const hasHeaderContent = eyebrow || title || description || action;

  return (
    <section className={cn('space-y-3', className)}>
      {hasHeaderContent && (
        <div className="flex items-start justify-between gap-3">
          <div>
            {eyebrow && (
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#8A8A8A]">
                {eyebrow}
              </p>
            )}
            {title && <h4 className="text-sm font-semibold text-[#0f172a]">{title}</h4>}
            {description && <p className="text-sm text-[#6B7280] mt-1">{description}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={cn('space-y-3', contentClassName)}>
        {children}
      </div>
    </section>
  );
}

