import Link from "next/link";

export function PrimaryButton({
  href,
  children,
  type = "button",
  disabled = false,
  onClick
}: {
  href?: string;
  children: React.ReactNode;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
}) {
  const cls =
    "inline-flex min-h-12 items-center justify-center rounded-full bg-gold px-6 py-3 font-bold text-ink shadow-glow transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50";

  if (href) return <Link className={cls} href={href}>{children}</Link>;
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

export function SecondaryButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-12 items-center justify-center rounded-full border border-peacock px-6 py-3 font-bold text-warm transition hover:bg-peacock/10"
    >
      {children}
    </Link>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  description
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mx-auto mb-10 max-w-3xl text-center">
      {eyebrow && <p className="mb-3 text-sm font-bold uppercase tracking-[.25em] text-gold">{eyebrow}</p>}
      <h2 className="text-4xl font-black tracking-tight sm:text-5xl">{title}</h2>
      {description && <p className="mx-auto mt-4 max-w-2xl text-muted">{description}</p>}
    </div>
  );
}
