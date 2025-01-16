import { Form } from 'react-router';
import type { RouteHandle } from 'react-router';

import { useTranslation } from 'react-i18next';

import { Button } from '~/components/button';
import { InputField } from '~/components/input-field';
import { Menu, MenuItem } from '~/components/menu';
import { PageTitle } from '~/components/page-title';
import { handle as parentHandle } from '~/routes/protected/layout';

export const handle = {
  i18nNamespace: [...parentHandle.i18nNamespace, 'protected'],
} as const satisfies RouteHandle;

export default function FirstName() {
  const { t } = useTranslation(handle.i18nNamespace);

  return (
    <>
      <div className="mb-8">
        <Menu>
          <MenuItem to="/">{t('protected:index.home')}</MenuItem>
          <MenuItem file="routes/protected/index.tsx">{t('protected:index.protected')}</MenuItem>
          <MenuItem file="routes/public/index.tsx">{t('protected:index.public')}</MenuItem>
        </Menu>

        <PageTitle className="mt-8">{t('protected:person-case.page-title')}</PageTitle>
        <Form id="first-name-form" method="post">
          <InputField
            className="mb-4"
            id="first-name-id"
            label={t('protected:person-case.first-name')}
            name="first-name"
            required
            type="text"
          />
          <Button>{t('protected:person-case.add-button')}</Button>
        </Form>
      </div>
    </>
  );
}

export function action() {
  return {
    title: 'First Name',
  };
}
