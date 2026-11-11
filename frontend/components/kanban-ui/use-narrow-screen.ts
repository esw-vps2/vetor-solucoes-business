'use client';

import { useEffect, useState } from 'react';

export function useNarrowScreen() {
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const apply = () => setNarrow(media.matches);
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, []);

  return narrow;
}
