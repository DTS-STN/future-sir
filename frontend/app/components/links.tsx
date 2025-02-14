import type { ComponentProps, JSX, MouseEvent } from 'react';

import type { Params, Path } from 'react-router';
import { generatePath, Link } from 'react-router';

import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';
import { useLanguage } from '~/hooks/use-language';
import type { I18nRouteFile } from '~/i18n-routes';
import { i18nRoutes } from '~/i18n-routes';
import { getRouteByFile } from '~/utils/route-utils';
import { cn } from '~/utils/tailwind-utils';

/**
 * Props for a bilingual link component targeting an internationalized route.
 *
 * This type extends the base properties of a React Router `Link` component,
 * excluding the `to` property, and adds fields specific to i18n routes.
 */
type BilingualLinkProps = OmitStrict<ComponentProps<typeof Link>, 'to'> & {
  disabled?: boolean;
  file: I18nRouteFile;
  hash?: Path['hash'];
  lang?: Language;
  params?: Params;
  search?: Path['search'];
  to?: never;
};

/**
 * Props for a unilingual link component targeting a route in a single language.
 *
 * This type extends the base properties of a React Router `Link` component,
 * excluding the `lang` property from the base type, and enforces constraints
 * to ensure that only standard routes (non-i18n) are used.
 */
type UnilingualLinkProps = OmitStrict<ComponentProps<typeof Link>, 'lang'> & {
  disabled?: boolean;
  file?: never;
  hash?: never;
  lang?: Language;
  params?: never;
  search?: never;
};

/**
 * Props for the `AppLink` component, supporting both bilingual (i18n) and unilingual routes.
 */
type AppLinkProps = BilingualLinkProps | UnilingualLinkProps;

/**
 * AnchorLinkProps represents the properties for the AnchorLink component.
 * It extends the ComponentProps<'a'> type, omitting the 'href' property,
 * and adds the required 'anchorElementId' property.
 */
type AnchorLinkProps = OmitStrict<ComponentProps<'a'>, 'href'> & {
  anchorElementId: string;
};

/**
 * Props for the `InlineLink` component. Effecetively extends the `AppLink` component's props.
 */
type InlineLinkProps = ComponentProps<typeof AppLink>;

/**
 * A flexible link component that supports both standard and i18n routes.
 *
 * - If the `to` property is provided, it creates a standard react-router link to the specified target.
 * - If the `to` property is omitted, the link is constructed dynamically using the provided `file`, `lang`, `params`, and other properties.
 *
 * @throws If the `lang` parameter is not provided and the current language cannot be determined.
 */
export function AppLink({ children, disabled, hash, lang, params, file, search, to, ...props }: AppLinkProps): JSX.Element {
  const { currentLanguage } = useLanguage();

  if (to !== undefined) {
    return (
      <Link lang={lang} to={to} {...props}>
        {children}
      </Link>
    );
  }

  const targetLanguage = lang ?? currentLanguage;

  if (targetLanguage === undefined) {
    throw new AppError(
      'The `lang` parameter was not provided, and the current language could not be determined from the request',
      ErrorCodes.MISSING_LANG_PARAM,
    );
  }

  if (disabled) {
    return (
      // see: "disabling a link" -- https://www.scottohara.me/blog/2021/05/28/disabled-links.html
      <a role="link" aria-disabled="true" {...props}>
        {children}
      </a>
    );
  }

  const route = getRouteByFile(file, i18nRoutes);
  const pathname = generatePath(route.paths[targetLanguage], params);

  const langProp = targetLanguage !== currentLanguage ? targetLanguage : undefined;
  const reloadDocumentProp = props.reloadDocument ?? lang !== undefined;

  return (
    <Link lang={langProp} to={{ hash, pathname, search }} reloadDocument={reloadDocumentProp} {...props}>
      {children}
    </Link>
  );
}

/**
 * AnchorLink is a React component used to create anchor links that scroll
 * and focus on the specified target element when clicked.
 *
 * @param props - The properties for the AnchorLink component.
 * @returns React element representing the anchor link.
 */
export function AnchorLink({ anchorElementId, children, onClick, ...restProps }: AnchorLinkProps): JSX.Element {
  /**
   * handleOnSkipLinkClick is the click event handler for the anchor link.
   * It prevents the default anchor link behavior, scrolls to and focuses
   * on the target element specified by 'anchorElementId', and invokes
   * the optional 'onClick' callback.
   */
  function handleOnSkipLinkClick(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    scrollAndFocusFromAnchorLink(event.currentTarget.href);
    onClick?.(event);
  }

  return (
    <a href={`#${anchorElementId}`} onClick={handleOnSkipLinkClick} data-testid="anchor-link" {...restProps}>
      {children}
    </a>
  );
}

/**
 * A styled link component designed for inline text links, supporting both standard and i18n routes.
 *
 * - For i18n routes, the `file`, `hash`, `params`, and `search` properties are used to dynamically construct the URL.
 * - For standard routes, the `to` property is used directly.
 * - Applies default styling with additional customization via the `className` property.
 *
 * @throws If the `lang` parameter is not provided and the current language cannot be determined.
 */
export function InlineLink({ className, children, file, hash, params, search, to, ...props }: InlineLinkProps): JSX.Element {
  const baseClassName = cn('text-slate-700 underline hover:text-blue-700 focus:text-blue-700');

  if (file) {
    return (
      <AppLink className={cn(baseClassName, className)} file={file} hash={hash} params={params} search={search} {...props}>
        {children}
      </AppLink>
    );
  }

  return (
    <AppLink className={cn(baseClassName, className)} to={to} {...props}>
      {children}
    </AppLink>
  );
}

/**
 * Scrolls and focuses on the element identified by the anchor link's hash.
 *
 * @param href - The anchor link URL.
 */
function scrollAndFocusFromAnchorLink(href: string): void {
  if (URL.canParse(href)) {
    const { hash } = new URL(href);

    if (hash) {
      const targetElement = document.getElementById(hash.replace('#', ''));

      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
        targetElement.focus();
      }
    }
  }
}
