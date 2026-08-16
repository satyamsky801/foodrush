import { useState } from 'react';

/**
 * Image with graceful degradation:
 *  - shows a shimmer skeleton while loading
 *  - falls back to a gradient + emoji tile if the image fails (offline, etc.)
 */
export default function AppImage({ src, alt = '', emoji = '🍽️', className = '', imgClassName = '' }) {
  const [state, setState] = useState('loading'); // loading | ok | error

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {state !== 'ok' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-100 to-ember-100">
          <span className="text-4xl" aria-hidden="true">
            {emoji}
          </span>
        </div>
      )}
      {state === 'loading' && <div className="absolute inset-0 skeleton" aria-hidden="true" />}
      {state !== 'error' && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setState('ok')}
          onError={() => setState('error')}
          className={`h-full w-full object-cover transition-opacity duration-500 ${
            state === 'ok' ? 'opacity-100' : 'opacity-0'
          } ${imgClassName}`}
        />
      )}
    </div>
  );
}
