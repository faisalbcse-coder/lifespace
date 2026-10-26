/** Fixed ambient morphing liquid background rendered behind every page. Purely decorative. */
export function AuroraBackground() {
  return (
    <div className="liquid-bg" aria-hidden="true">
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />
    </div>
  );
}
