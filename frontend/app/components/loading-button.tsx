import type { ComponentProps } from 'react';

import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import type { FontAwesomeIconProps } from '@fortawesome/react-fontawesome';

import { Button } from '~/components/button';
import { ButtonEndIcon, ButtonStartIcon } from '~/components/button-icons';

type ButtonEndIconProps = ComponentProps<typeof ButtonEndIcon>;
type ButtonStartIconProps = ComponentProps<typeof ButtonStartIcon>;

export interface LoadingButtonProps extends ComponentProps<'button'> {
  endIcon?: ButtonEndIconProps['icon'];
  endIconProps?: OmitStrict<ButtonEndIconProps, 'icon'>;
  pill?: boolean;
  startIcon?: ButtonStartIconProps['icon'];
  startIconProps?: OmitStrict<ButtonStartIconProps, 'icon'>;
  loading?: boolean;
  loadingIcon?: FontAwesomeIconProps['icon'];
  loadingIconProps?: OmitStrict<FontAwesomeIconProps, 'icon'>;
  loadingPosition?: 'end' | 'start';
}
export function LoadingButton({
  children,
  endIcon,
  endIconProps,
  disabled = false,
  loading = false,
  loadingIcon,
  loadingIconProps,
  loadingPosition = 'end',
  startIcon,
  startIconProps,
  ...props
}: LoadingButtonProps) {
  const resolvedLoadingIconProps = {
    icon: loadingIcon ?? faSpinner,
    spin: true,
    ...(loadingIconProps ?? {}),
  } satisfies FontAwesomeIconProps;
  const isLoadingAtStartPosition = loading === true && loadingPosition === 'start';
  const resolvedStartIcon = isLoadingAtStartPosition
    ? resolvedLoadingIconProps
    : { icon: startIcon, ...(startIconProps ?? {}) };

  const isLoadingAtEndPosition = loading === true && loadingPosition === 'end';
  const resolvedEndIcon = isLoadingAtEndPosition ? resolvedLoadingIconProps : { icon: endIcon, ...(endIconProps ?? {}) };

  return (
    <Button disabled={disabled || loading} {...props}>
      {resolvedStartIcon.icon && (
        <ButtonStartIcon className={loadingIcon ? '' : 'animate-spin'} {...resolvedStartIcon} icon={resolvedStartIcon.icon} />
      )}
      <span>{children}</span>
      {resolvedEndIcon.icon && (
        <ButtonEndIcon className={loadingIcon ? '' : 'animate-spin'} {...resolvedEndIcon} icon={resolvedEndIcon.icon} />
      )}
    </Button>
  );
}
