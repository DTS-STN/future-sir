import type { JSX } from 'react';

import { faChevronDown, faRightFromBracket, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';

import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuTrigger } from '~/components/dropdown-menu';
import { LanguageSwitcher } from '~/components/language-switcher';
import { Menu, MenuItem } from '~/components/menu';
import { cn } from '~/utils/tailwind-utils';

type AppBarProps = {
  children: React.ReactNode;
  name?: string;
  profileItems?: React.ReactNode;
};

export function AppBar({ children, name, profileItems }: AppBarProps): JSX.Element {
  const { t } = useTranslation(['gcweb']);

  return (
    <div className="bg-slate-700">
      <div className="align-center container mx-auto flex flex-wrap justify-between">
        <div className="align-center flex">
          <Menu>{children}</Menu>
        </div>
        <div className="flex items-center space-x-4 text-right">
          {name && <UserButton name={name}>{profileItems}</UserButton>}
          <LanguageSwitcher>{t('gcweb:language-switcher.alt-lang')}</LanguageSwitcher>
        </div>
      </div>
    </div>
  );
}

type UserButtonProps = {
  className?: string;
  children?: React.ReactNode;
  name?: string;
};

function UserButton({ className, children, name }: UserButtonProps): JSX.Element {
  const { t } = useTranslation(['gcweb']);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'flex h-full flex-nowrap space-x-2 bg-slate-600 px-2 text-sm text-white hover:bg-slate-500 hover:underline focus:ring-2 focus:ring-black focus:ring-offset-2 focus:outline-hidden aria-expanded:bg-slate-800 aria-expanded:text-white sm:space-x-4 sm:px-4',
          className,
        )}
      >
        <div className="text-md my-auto flex flex-nowrap items-center space-x-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white">
            <FontAwesomeIcon icon={faUser} className="size-5 text-slate-700" />
          </div>
          <span id="menu-label" className="text-md hidden py-2 font-bold sm:block">
            {name}
          </span>
        </div>
        <FontAwesomeIcon icon={faChevronDown} className="my-auto size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 bg-slate-700">
        <UserName name={name} />
        <MenuItem file="routes/protected/index.tsx">{t('gcweb:app.profile')}</MenuItem>
        {children}
        <MenuItem to="/auth/logout" className="text-md flex justify-between">
          {t('gcweb:app.logout')}
          <FontAwesomeIcon icon={faRightFromBracket} className="my-auto size-8" />
        </MenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type UserNameProps = {
  name?: string;
};

function UserName({ name }: UserNameProps): JSX.Element {
  return (
    <>
      {name !== undefined && (
        <DropdownMenuLabel className="text-md flex items-center border-b-2 border-slate-600 px-3 py-2 text-gray-300 sm:hidden">
          <FontAwesomeIcon icon={faUser} className="mr-2 size-4" />
          {name}
        </DropdownMenuLabel>
      )}
    </>
  );
}
