import Link from "next/link";

export function BrandLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  };

  return (
    <Link href="/" className="inline-flex items-center gap-2">
      <span
        className={`font-display font-bold tracking-tight text-white ${sizes[size]}`}
      >
        P
        <span className="text-white/90">BUDGET</span>
      </span>
    </Link>
  );
}
