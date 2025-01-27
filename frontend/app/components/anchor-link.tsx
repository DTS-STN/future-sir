import type { ComponentProps, JSX, MouseEvent } from 'react';

/**
 * AnchorLinkProps represents the properties for the AnchorLink component.
 * It extends the ComponentProps<'a'> type, omitting the 'href' property,
 * and adds the required 'anchorElementId' property.
 */
export interface AnchorLinkProps extends OmitStrict<ComponentProps<'a'>, 'href'> {
  anchorElementId: string;
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
 * Scrolls and focuses on the element identified by the anchor link's hash.
 *
 * @param href - The anchor link URL.
 */
function scrollAndFocusFromAnchorLink(href: string): void {
  if (URL.canParse(href)) {
    const { hash } = new URL(href);

    if (hash) {
      const targetElement = document.querySelector<HTMLElement>(hash);

      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
        targetElement.focus();
      }
    }
  }
}
