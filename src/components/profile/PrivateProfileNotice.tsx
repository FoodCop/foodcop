// Shown under a private profile's header (which stays visible, Instagram-style)
// in place of the posts / highlights / Food DNA the viewer isn't approved to see.
export default function PrivateProfileNotice({ name }: { name: string }) {
  return (
    <section className="fz-private-notice" aria-label="Private account">
      <div className="fz-private-notice__icon" aria-hidden>🔒</div>
      <h2 className="fz-private-notice__title">This account is private</h2>
      <p className="fz-private-notice__sub">Follow {name} to see their posts, highlights and Food DNA. They&rsquo;ll need to approve your request.</p>
    </section>
  );
}
