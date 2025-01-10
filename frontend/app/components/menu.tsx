import type { ComponentProps } from 'react';
import { useState } from 'react';

import { useTranslation } from 'react-i18next';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '~/components/dropdown-menu';
import { InlineLink } from '~/components/inline-link';
import { cn } from '~/utils/tailwind-utils';

type MenuItemProps = ComponentProps<typeof InlineLink>;

export function MenuItem({ children, ...props }: MenuItemProps) {
  return (
    <DropdownMenuItem className="text-md m-0 p-0 hover:!bg-slate-700">
      <InlineLink
        role="menuitem"
        id="menu-item"
        className="w-full px-3 py-2 text-white hover:bg-slate-300 hover:text-blue-950 focus:bg-slate-600 focus:text-white active:bg-slate-800 active:text-white"
        {...props}
      >
        {children}
      </InlineLink>
    </DropdownMenuItem>
  );
}

interface MenuProps {
  className?: string;
  children: React.ReactNode;
}

export function Menu({ className, children }: MenuProps) {
  const { t } = useTranslation(['gcweb']);
  const [open, setOpen] = useState(false);
  const baseClassName = cn(
    'focus:outline-none hover:underline select-none text-lg inline-flex justify-center space-x-2 rounded-b-md border-b border-l border-r border-slate-700 px-4 py-2 ring-black ring-opacity-5',
    open ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-slate-700 text-white hover:bg-slate-600',
  );

  return (
    <DropdownMenu onOpenChange={(open) => setOpen(open)}>
      <DropdownMenuTrigger asChild className={cn(baseClassName, className)} aria-haspopup={true} aria-expanded={open}>
        <button>
          <span id="menu-label">{t('gcweb:app.menu')}</span>
          {open ? <UpChevron /> : <DownChevron />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 !bg-slate-700">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UpChevron() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="my-auto size-5 fill-current">
      {/*!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.*/}
      <path d="M233.4 105.4c12.5-12.5 32.8-12.5 45.3 0l192 192c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L256 173.3 86.6 342.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l192-192z" />
    </svg>
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
