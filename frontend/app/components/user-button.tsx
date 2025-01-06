import { useState } from 'react';

import { useTranslation } from 'react-i18next';

import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuTrigger } from './dropdown-menu';
import { MenuItem } from './menu';

import { cn } from '~/utils/tailwind-utils';

interface UserButtonProps {
  className?: string;
  children?: React.ReactNode;
  name?: string;
}

export function UserButton({ className, children, name }: UserButtonProps) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation(['gcweb']);
  const baseClassName = cn(
    'w-10 h-10 my-0 text-white rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-slate-300',
    open ? 'bg-slate-900 hover:bg-slate-800' : 'bg-slate-700 hover:bg-slate-600',
  );

  return (
    <DropdownMenu onOpenChange={(open) => setOpen(open)}>
      <DropdownMenuTrigger
        asChild
        title={t('gcweb:app.profile')}
        aria-label={t('gcweb:app.profile')}
        className={cn(baseClassName, className)}
        aria-haspopup={true}
        aria-expanded={open}
      >
        <button>
          <UserCircleIcon />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 !bg-slate-700">
        <UserName name={name} />
        {children}
        <MenuItem to="/auth/logout">{t('gcweb:app.logout')}</MenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserCircleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor" className="size-6">
      {/*!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.*/}
      <path d="M304 128a80 80 0 1 0 -160 0 80 80 0 1 0 160 0zM96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM49.3 464l349.5 0c-8.9-63.3-63.3-112-129-112l-91.4 0c-65.7 0-120.1 48.7-129 112zM0 482.3C0 383.8 79.8 304 178.3 304l91.4 0C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7L29.7 512C13.3 512 0 498.7 0 482.3z" />
    </svg>
  );
}

function UserName({ name }: { name?: string }) {
  return (
    <>
      {name !== undefined && (
        <DropdownMenuLabel className="text-md flex items-center border-b-2 border-slate-600 px-3 py-2 text-gray-300">
          <UserIcon />
          {name}
        </DropdownMenuLabel>
      )}
    </>
  );
}

function UserIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor" className="mr-2 size-4">
      {/*!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.*/}
      <path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512l388.6 0c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304l-91.4 0z" />
    </svg>
  );
}
