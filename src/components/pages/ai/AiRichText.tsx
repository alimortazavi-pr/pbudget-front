import type { ReactNode } from "react";

/** Inline **bold** only; everything else stays plain text (no HTML is ever injected). */
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
      <strong key={index}>{part.slice(2, -2)}</strong>
    ) : (
      part
    ),
  );
}

const BULLET = /^\s*(?:[-•*]|\d+[.)]|[۰-۹]+[.)])\s+/;

/** Renders the small markdown subset the assistant uses: paragraphs, bullet/numbered lines, **bold**. */
export function AiRichText({ text, className = "" }: { text: string; className?: string }) {
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  const flush = () => {
    if (list.length === 0) return;
    blocks.push(
      <ul key={`l${blocks.length}`} className="my-1.5 list-disc space-y-1 ps-5">
        {list.map((item, index) => (
          <li key={index}>{inline(item)}</li>
        ))}
      </ul>,
    );
    list = [];
  };
  text.split("\n").forEach((line) => {
    if (BULLET.test(line)) {
      list.push(line.replace(BULLET, ""));
      return;
    }
    flush();
    if (line.trim()) blocks.push(<p key={`p${blocks.length}`}>{inline(line)}</p>);
  });
  flush();
  return <div className={`space-y-1.5 leading-7 ${className}`}>{blocks}</div>;
}
