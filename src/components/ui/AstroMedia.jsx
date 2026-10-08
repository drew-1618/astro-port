import PlaceholderAstro from './PlaceholderAstro';

/*
 * Data paths like '/astro/m42.jpg' point into /public. Prefix them with the
 * deploy base ('/astro-port/' on GitHub Pages) so they resolve in production.
 */
function assetUrl(path) {
  if (/^(https?:|data:|blob:)/.test(path)) return path;
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
}

/*
 * Renders a capture's real image when `photo.image` is set, otherwise the
 * procedural placeholder. The `.astro-media` wrapper lets red mode tint
 * imagery to preserve night vision.
 */
export default function AstroMedia({ photo, className = '', eager = false }) {
  return (
    <div className={`astro-media relative overflow-hidden bg-black ${className}`}>
      {photo.image ? (
        <img
          src={assetUrl(photo.image)}
          alt={`${photo.target} (${photo.catalogId})`}
          loading={eager ? 'eager' : 'lazy'}
          className="h-full w-full object-cover"
        />
      ) : (
        <PlaceholderAstro kind={photo.placeholder?.kind} seed={photo.placeholder?.seed} className="h-full w-full" />
      )}
    </div>
  );
}
