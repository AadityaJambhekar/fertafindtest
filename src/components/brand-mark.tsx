export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span className={`grid shrink-0 place-items-center ${className}`} aria-hidden="true">
      <img
        src="/fertafind-logo-transparent.png"
        alt=""
        className="h-full w-full object-contain"
      />
    </span>
  );
}
