import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';

// /terms and /privacy. The sign-up consent boxes link here, and each
// acceptance records the version shown below (lib/onboarding/policy).
// Placeholder text until the client sends FUZO's final, legally reviewed
// wording (docs/ONBOARDING_PLAN.md, "Still to confirm").

export interface LegalSection {
  title: string;
  body: string[];
}

export function LegalPage({ title, version, intro, sections }: { title: string; version: string; intro: string; sections: LegalSection[] }) {
  const updated = new Date(`${version}T12:00:00Z`).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });
  return (
    <div className="fz-legal">
      <main className="fz-legal__page">
        <Link href="/" className="fz-legal__back">
          <ArrowLeft size={15} aria-hidden="true" /> Home
        </Link>
        <h1 className="fz-legal__title">{title}</h1>
        <p className="fz-legal__meta">
          Version {version} · Last updated {updated}
        </p>
        <p className="fz-legal__draft" role="note">
          <FileText size={16} aria-hidden="true" />
          <span>
            <strong>Draft.</strong> This is placeholder text. FUZO&rsquo;s final, reviewed {title} will replace it before launch.
          </span>
        </p>
        <p className="fz-legal__intro">{intro}</p>
        {sections.map((s, i) => (
          <section key={s.title} className="fz-legal__section" aria-labelledby={`legal-${i}`}>
            <h2 id={`legal-${i}`}>
              {i + 1}. {s.title}
            </h2>
            {s.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </section>
        ))}
      </main>
    </div>
  );
}
