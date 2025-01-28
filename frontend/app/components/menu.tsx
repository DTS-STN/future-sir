import type { ComponentProps } from 'react';

import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '~/components/dropdown-menu';
import { AppLink } from '~/components/links';
import { cn } from '~/utils/tailwind-utils';

type MenuItemProps = ComponentProps<typeof AppLink>;

export function MenuItem({ children, className, ...props }: MenuItemProps) {
  return (
    <DropdownMenuItem
      asChild
      className={cn(
        'text-md cursor-pointer px-3 py-2 text-white hover:bg-slate-300 hover:text-white focus:bg-slate-600 active:bg-slate-800',
        className,
      )}
    >
      <AppLink data-testid="menu-item" {...props}>
        {children}
      </AppLink>
    </DropdownMenuItem>
  );
}

interface MenuProps {
  className?: string;
  children: React.ReactNode;
}

export function Menu({ className, children }: MenuProps) {
  const { t } = useTranslation(['gcweb']);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'flex h-full flex-nowrap space-x-2 bg-slate-700 px-2 text-white hover:bg-slate-600 hover:underline focus:ring-2 focus:ring-black focus:ring-offset-2 focus:outline-hidden aria-expanded:bg-slate-900 aria-expanded:text-white sm:space-x-3 sm:px-4',
          className,
        )}
      >
        <span id="menu-label" className="my-auto py-2 sm:text-2xl">
          {t('gcweb:app.title')}
        </span>
        <FontAwesomeIcon icon={faChevronDown} className="my-auto size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 bg-slate-700">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
