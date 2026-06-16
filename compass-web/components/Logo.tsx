import Image from "next/image";

/**
 * Brand mark — the new Compass logo from /public/logo.png.
 * Keeps the `className`-driven sizing API (e.g. "h-6 w-6") so every existing
 * caller (SideNav, AdvisorPanel) keeps working unchanged. `fill` + object-contain
 * preserves the logo's aspect ratio inside whatever square the caller asks for.
 */
export function Logo({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <span className={`relative inline-block ${className}`}>
      <Image
        src="/logo.png"
        alt="The Compass"
        fill
        sizes="48px"
        className="object-contain"
        priority
      />
    </span>
  );
}
