import { useCallback, useState } from 'react';

// react-router yerine: adres çubuğundaki sorgu parametrelerini okur/yazar (tek sayfa, yönlendirici yok).
export function useSearchParams(): [URLSearchParams, (p: URLSearchParams, opts?: { replace?: boolean }) => void] {
  const [params] = useState(() => new URLSearchParams(window.location.search));
  const yaz = useCallback((p: URLSearchParams, opts?: { replace?: boolean }) => {
    const url = `${window.location.pathname}?${p.toString()}${window.location.hash}`;
    if (opts?.replace) window.history.replaceState(null, '', url);
    else window.history.pushState(null, '', url);
  }, []);
  return [params, yaz];
}
