import { useEffect, useState } from 'react';

export default function ProtectedImage({ src, alt, className }: { src?: string; alt: string; className?: string }) {
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (!src) {
      setUrl('');
      return;
    }

    const imageUrl = src.startsWith('/uploads/') ? `/api${src}` : src;
    let objectUrl = '';
    fetch(imageUrl, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
    })
      .then(response => response.ok ? response.blob() : Promise.reject(new Error('Image unavailable')))
      .then(blob => {
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => setUrl(''));

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  return url ? <img src={url} alt={alt} className={className} /> : null;
}
