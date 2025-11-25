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

export function SidebarPanel({
  eyebrow,
  title,
  action,
  footer,
  children,
  className,
  fullHeight = false,
}: SidebarPanelProps) {
  // Full-height style: matches Scout sidebar (border-r, no rounded corners, full height)
  if (fullHeight) {
    return (
      <aside
        className={cn(
          'w-[280px] bg-white border-r border-gray-200 flex flex-col h-full',
          className
        )}
        aria-label={title ?? 'Sidebar'}
      >
        {/* Header */}
        {(eyebrow || title || action) && (
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between gap-3">
              <div>
                {eyebrow && (
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#8A8A8A]">
                    {eyebrow}
                  </p>
                )}
                {title && <h3 className="text-lg font-bold text-[#0f172a]">{title}</h3>}
              </div>
              {action}
            </div>
          </div>
        )}

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="p-4 border-t border-gray-100">{footer}</div>
        )}
      </aside>
    );
  }

  // Card style (original)
  return (
    <aside className={cn('w-80 flex-shrink-0', className)} aria-label={title ?? 'Sidebar'}>
      <div className="sticky top-6">
        <div className="bg-white border border-[#EEE] rounded-3xl shadow-sm p-6 flex flex-col gap-6">
          {(eyebrow || title || action) && (
            <div className="flex items-center justify-between gap-3">
              <div>
                {eyebrow && (
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#8A8A8A]">
                    {eyebrow}
                  </p>
                )}
                {title && <h3 className="text-2xl font-bold text-[#0f172a]">{title}</h3>}
              </div>
              {action}
            </div>
          )}

          <div className="space-y-6">{children}</div>

          {footer && (
            <div className="pt-4 border-t border-[#EEE]">{footer}</div>
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

