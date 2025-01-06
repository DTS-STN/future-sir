import { useState } from 'react';
import { cn } from '~/utils/tailwind-utils';
import { useTranslation } from 'react-i18next';
import { MenuItem } from './menu';

interface UserButtonProps {
  className?: string;
  children?: React.ReactNode;
  name?: string;
}

export function UserButton({ className, children, name }: UserButtonProps) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation(['gcweb']);
  const baseClassName = cn(
    'w-12 h-12 text-white rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-slate-300',
    open ? 'bg-slate-900 hover:bg-slate-800' : 'bg-slate-700 hover:bg-slate-600',
  );

  const onClick = () => {
    setOpen((value) => !value);
  };

  return (
    <div className="relative inline-block text-right">
      <button title={t('gcweb:app.profile')} aria-label={t('gcweb:app.profile')} type="button" onClick={onClick} className={cn(baseClassName, className)} aria-haspopup={true} aria-expanded={open}>
        <UserCircle/>
      </button>
      {open && (
        <div
          className="absolute right-0 mt-2 w-64 text-left rounded-md shadow-lg ring-1 ring-black ring-opacity-5 bg-gradient-to-b bg-slate-700"
          role="menu"
          aria-orientation="vertical"
          tabIndex={-1}
        >
          <div className="py-1" role="none">
            <UserName name={name} />
            {children}
            <MenuItem to="/auth/logout">{t('gcweb:app.logout')}</MenuItem>
          </div>
        </div>
      )}
    </div>
  );
}

function UserCircle() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-12">
      <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 0 0 3.065 7.097A9.716 9.716 0 0 0 12 21.75a9.716 9.716 0 0 0 6.685-2.653Zm-12.54-1.285A7.486 7.486 0 0 1 12 15a7.486 7.486 0 0 1 5.855 2.812A8.224 8.224 0 0 1 12 20.25a8.224 8.224 0 0 1-5.855-2.438ZM15.75 9a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" clipRule="evenodd" />
    </svg>
  );
}

function UserName({ name }: {name?: string}) {
  return (
    <>
      {name !== undefined && (
        <div className="flex text-md px-4 py-2 text-gray-300 border-b-2 border-slate-600">
          <UserIcon />
          {name}
        </div>
      )}
    </>
  )
}

function UserIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6 mr-2">
      <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
    </svg>
  );
}
