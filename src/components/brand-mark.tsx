export function BrandMark({
  className = "",
  alt = "FertaFind logo",
}: {
  className?: string;
  alt?: string;
}) {
  return (
    <span
      className={`grid shrink-0 place-items-center ${className}`}
      aria-hidden={alt ? undefined : true}
    >
      <img
        src="/fertafind-logo-transparent.png"
        alt={alt}
        className="h-full w-full object-contain"
      />
    </span>
  );
}
