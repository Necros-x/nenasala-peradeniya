export function BrandLogo({
  className = "",
  alt = "Nenasala Peradeniya",
}: {
  className?: string;
  alt?: string;
}) {
  return (
    <>
      <img
        src="/brand/nenasala-logo.png"
        alt={alt}
        className={`object-contain dark:hidden ${className}`}
      />
      <img
        src="/brand/nenasala-logo-dark.png"
        alt={alt}
        className={`hidden object-contain dark:block ${className}`}
      />
    </>
  );
}
