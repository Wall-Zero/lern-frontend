import { useEffect } from 'react';

/**
 * Hook to set dynamic page titles
 * @param title - The page-specific title (e.g., "Workspace", "Dashboard")
 * @param deps - Optional dependencies array to trigger title updates
 */
export const usePageTitle = (title: string, deps: unknown[] = []) => {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title ? `LERN | ${title}` : 'LERN';

    return () => {
      document.title = prevTitle;
    };
  }, [title, ...deps]);
};

export default usePageTitle;
