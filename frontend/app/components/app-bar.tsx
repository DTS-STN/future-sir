import { useTranslation } from 'react-i18next';

import { LanguageSwitcher } from '~/components/language-switcher';
import { Menu } from '~/components/menu';
import { UserButton } from '~/components/user-button';

interface AppBarProps {
  children: React.ReactNode;
  name?: string;
  profileItems?: React.ReactNode;
}

export function AppBar({ children, name, profileItems }: AppBarProps) {
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
