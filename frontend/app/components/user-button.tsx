import { useState } from 'react';

import { faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';

import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuTrigger } from '~/components/dropdown-menu';
import { MenuItem } from '~/components/menu';
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
    'my-0 flex h-10 w-10 items-center justify-center rounded-full text-white focus:outline-none focus:ring-2 focus:ring-slate-300',
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
          <FontAwesomeIcon icon={faUser} className="size-6" />
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

function UserName({ name }: { name?: string }) {
  return (
    <>
      {name !== undefined && (
        <DropdownMenuLabel className="text-md flex items-center border-b-2 border-slate-600 px-3 py-2 text-gray-300">
          <FontAwesomeIcon icon={faUser} className="mr-2 size-4" />
          {name}
        </DropdownMenuLabel>
      )}
    </>
  );
}
