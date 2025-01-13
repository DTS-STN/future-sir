import type { ComponentProps } from 'react';

import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';

import { AppLink } from '~/components/app-link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '~/components/dropdown-menu';
import { cn } from '~/utils/tailwind-utils';

type MenuItemProps = ComponentProps<typeof AppLink>;

export function MenuItem({ children, ...props }: MenuItemProps) {
  return (
    <DropdownMenuItem asChild className="cursor-pointer">
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
          'flex flex-nowrap space-x-2 rounded-b-md border-x border-b border-slate-700 bg-slate-700 px-4 py-2 text-lg text-white hover:bg-slate-800 hover:underline focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 aria-expanded:bg-slate-900 aria-expanded:text-white',
          className,
        )}
      >
        <span id="menu-label">{t('gcweb:app.menu')}</span>
        <FontAwesomeIcon icon={faChevronDown} className="my-auto size-5 fill-current" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
