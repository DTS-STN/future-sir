import { useLocation } from 'react-router';

import { getAltLanguage, getLanguage } from '~/utils/i18n-utils';

type UseLanguageReturnType = { altLanguage?: Language; currentLanguage?: Language };

/**
 * A hook that returns the current language and its alternate language.
 *
 * @returns An object containing the current language the alternate language.
 */
export function useLanguage(): UseLanguageReturnType {
  const { pathname } = useLocation();

  const currentLanguage = getLanguage(pathname);
  const altLanguage = currentLanguage && getAltLanguage(currentLanguage);

  return { altLanguage, currentLanguage };
}
