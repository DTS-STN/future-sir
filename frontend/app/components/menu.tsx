import type { ComponentProps } from 'react';

import { useTranslation } from 'react-i18next';

import { AppLink } from '~/components/app-link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '~/components/dropdown-menu';
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
          'flex flex-nowrap space-x-2 rounded-b-md border-x border-b border-slate-700 bg-slate-700 px-4 py-2 text-lg text-white hover:bg-slate-800 hover:underline focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 aria-expanded:bg-slate-900 aria-expanded:text-white',
          className,
        )}
      >
        <span id="menu-label">{t('gcweb:app.menu')}</span>
        <DownChevron />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 bg-slate-700">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DownChevron() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="my-auto size-5 fill-current">
      {/*!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.*/}
      <path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z" />
    </svg>
  );
}
