import PlaceholderAstro from './PlaceholderAstro';

/*
 * Data paths like '/astro/m42.jpg' point into /public. Prefix them with the
 * deploy base ('/astro-port/' on GitHub Pages) so they resolve in production.
 */
export function assetUrl(path) {
  if (/^(https?:|data:|blob:)/.test(path)) return path;
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
}

/*
 * Renders a capture's real image when `photo.image` is set, otherwise the
 * procedural placeholder. The `.astro-media` wrapper lets red mode tint
 * imagery to preserve night vision.
 *   variant 'thumb': the small file, cropped to fill the box (gallery cards).
 *   variant 'full':  the full file, uncropped at its natural aspect (lightbox).
 */
export default function AstroMedia({ photo, className = '', eager = false, variant = 'thumb' }) {
  const full = variant === 'full';
  return (
    <div className={`astro-media relative overflow-hidden bg-black ${className}`}>
      {photo.image ? (
        <img
          src={assetUrl(full ? photo.image : photo.thumb || photo.image)}
          alt={`${photo.target} (${photo.catalogId})`}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          className={full ? 'mx-auto block max-h-[70dvh] w-auto max-w-full object-contain land:max-h-[60dvh]' : 'h-full w-full object-cover'}
        />
      ) : (
        <PlaceholderAstro kind={photo.placeholder?.kind} seed={photo.placeholder?.seed} className="h-full w-full" />
      )}
    </div>
  );
}
