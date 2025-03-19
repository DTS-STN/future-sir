import type { ReactNode } from 'react';
import { useId, useState, useEffect } from 'react';

import type { RouteHandle } from 'react-router';
import { useFetcher } from 'react-router';

import type { ResourceKey } from 'i18next';
import { useTranslation } from 'react-i18next';

import type { Info, Route } from './+types/sin-confirmation';

import { serverEnvironment } from '~/.server/environment';
import { requireAuth } from '~/.server/utils/auth-utils';
import { i18nRedirect } from '~/.server/utils/route-utils';
import { Button } from '~/components/button';
import { PageTitle } from '~/components/page-title';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';
import { getTranslation } from '~/i18n-config.server';
import { handle as parentHandle } from '~/routes/protected/layout';
import { dateToLocalizedText } from '~/utils/date-utils';

export const handle = {
  i18nNamespace: [...parentHandle.i18nNamespace, 'protected'],
} as const satisfies RouteHandle;

export async function loader({ context, request }: Route.LoaderArgs) {
  requireAuth(context.session, new URL(request.url), ['user']);
  const { t } = await getTranslation(request, handle.i18nNamespace);

  //TODO: replace with record data (names, city, etc)
  return {
    documentTitle: t('protected:sin-confirmation.page-title'),
    recordDetails: {
      date: dateToLocalizedText(serverEnvironment.BASE_TIMEZONE),
      firstName: 'Johnathan',
      middleNames: ['Joe', 'James'],
      familyNames: ['Doe', 'Smith'],
      address: '123 Main St. Suite 4B',
      postalCode: 'A1A 1A1',
      city: 'City',
      province: 'Province',
    },
  };
}

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data.documentTitle }];
}

export async function action({ context, request }: Route.ActionArgs) {
  requireAuth(context.session, new URL(request.url), ['user']);

  const formData = await request.formData();
  const action = formData.get('action');

  switch (action) {
    case 'finish': {
      throw i18nRedirect('routes/protected/request.tsx', request); //TODO: update redirect to proper page
    }
    case 'print': {
      // TODO: fetch the proper sin
      return { sin: '123456789' };
    }
    default: {
      throw new AppError(`Unrecognized action: ${action}`, ErrorCodes.UNRECOGNIZED_ACTION);
    }
  }
}

export default function SinConfirmation({ loaderData, actionData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespace);
  const fetcherKey = useId();
  const fetcher = useFetcher<Info['actionData']>({ key: fetcherKey });
  const isSubmitting = fetcher.state !== 'idle';
  const recordDetails = loaderData.recordDetails;
  const { dateEn, dateFr } = recordDetails.date;

  const [isPrinting, setIsPrinting] = useState(false);
  const [sinNumber, setSinNumber] = useState<string>();

  useEffect(() => {
    if (fetcher.data && isPrinting) {
      setSinNumber(fetcher.data.sin);
    }
  }, [fetcher.data, isPrinting]);

  useEffect(() => {
    if (sinNumber && isPrinting) {
      window.print();
      setIsPrinting(false);
      setSinNumber(undefined);
    }
  }, [sinNumber, isPrinting]);

  async function handlePrint() {
    setIsPrinting(true);
    await fetcher.submit({ action: 'print' }, { method: 'post' });
  }

  return (
    <>
      <PageTitle className="print:hidden" subTitleClassName="print:hidden" subTitle={t('protected:first-time.title')}>
        {t('protected:sin-confirmation.page-title')}
      </PageTitle>
      <div className="space-y-8 print:m-3 print:text-xs">
        <div className="grid items-center gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 print:grid-cols-3 print:sm:grid-cols-4">
          <dl className="flex items-center">
            <dt className="mr-[1ch]">Date:</dt>
            <dd className="font-semibold">
              <span lang="en">{dateEn}</span>
              <span className="mx-[0.5ch]">/</span>
              <span lang="fr">{dateFr}</span>
            </dd>
          </dl>
          <p className="font-semibold">
            <BilingualText resourceKey="protected:sin-confirmation.protected-b" />
          </p>
        </div>
        <section>
          <h3 className="text-center font-semibold">
            <BilingualText resourceKey="protected:sin-confirmation.social-insurance-number" />:
          </h3>
          <p className="mt-4 text-center font-semibold">
            <FormattedSIN sinNumber={sinNumber ?? '*********'} />
          </p>
        </section>
        <section>
          <h3 className="text-center font-semibold">
            <BilingualText resourceKey="protected:sin-confirmation.names-on-record" />
          </h3>
          <dl className="mt-5 grid items-center gap-5">
            <ConfirmationDetail resourceKey="protected:sin-confirmation.first-name">
              {recordDetails.firstName}
            </ConfirmationDetail>
            <ConfirmationDetail resourceKey="protected:sin-confirmation.middle-name">
              {recordDetails.middleNames.map((name) => (
                <span key={name} className="block">
                  {name}
                </span>
              ))}
            </ConfirmationDetail>
            <ConfirmationDetail resourceKey="protected:sin-confirmation.family-name">
              {recordDetails.familyNames.map((name) => (
                <span key={name} className="block">
                  {name}
                </span>
              ))}
            </ConfirmationDetail>
            <ConfirmationDetail resourceKey="protected:sin-confirmation.address">
              <span className="block">{recordDetails.address}</span>
              <span className="block">
                {recordDetails.city && <span className="mr-[0.5ch]">{recordDetails.city}</span>}
                {recordDetails.province && <span className="mr-[0.5ch]">{recordDetails.province}</span>}
                {recordDetails.postalCode}
              </span>
            </ConfirmationDetail>
          </dl>
        </section>
        <section className="grid gap-8 sm:gap-6">
          <BilingualTextColumns
            titleKey="protected:sin-confirmation.protect-sin.title"
            descriptionKey="protected:sin-confirmation.protect-sin.description"
          />
          <BilingualTextColumns
            titleKey="protected:sin-confirmation.use-of-sin.title"
            descriptionKey="protected:sin-confirmation.use-of-sin.description"
          />
          <BilingualTextColumns
            titleKey="protected:sin-confirmation.sin-begin-9.title"
            descriptionKey="protected:sin-confirmation.sin-begin-9.description"
          />
          <BilingualTextColumns
            titleKey="protected:sin-confirmation.more-information.title"
            descriptionKey="protected:sin-confirmation.more-information.description"
          />
        </section>
      </div>
      <fetcher.Form method="post" noValidate className="mt-12 space-x-3 print:hidden">
        <Button id="print-button" type="button" variant="primary" disabled={isSubmitting} onClick={handlePrint}>
          {t('protected:sin-confirmation.print')}
        </Button>
        <Button name="action" value="finish" id="finish-button" disabled={isSubmitting}>
          {t('protected:sin-confirmation.finish')}
        </Button>
      </fetcher.Form>
    </>
  );
}

interface FormattedSINProps {
  sinNumber: string;
}

function FormattedSIN({ sinNumber }: FormattedSINProps) {
  const parts = sinNumber.match(/.../g) ?? [];
  return <>{parts.join(' - ')}</>;
}

interface BilingualTextProps {
  resourceKey: ResourceKey;
}

function BilingualText({ resourceKey }: BilingualTextProps) {
  const { t } = useTranslation(handle.i18nNamespace);
  return (
    <>
      <span lang="en">{t(resourceKey, { lng: 'en' })}</span>
      <span className="mx-[0.5ch]">/</span>
      <span lang="fr">{t(resourceKey, { lng: 'fr' })}</span>
    </>
  );
}

interface ConfirmationDetailProps {
  resourceKey: ResourceKey;
  children: ReactNode;
}

function ConfirmationDetail({ resourceKey, children }: ConfirmationDetailProps) {
  return (
    <div className="grid sm:grid-cols-2 sm:gap-[2.5ch] print:grid-cols-2 print:gap-[2.5ch]">
      <dt className="mt-0 mb-auto flex items-center">
        <BilingualText resourceKey={resourceKey} />:
      </dt>
      <dd className="font-semibold">
        <span className="block">{children}</span>
      </dd>
    </div>
  );
}

interface BilingualTextColumnsProps {
  titleKey: ResourceKey;
  descriptionKey: ResourceKey;
}

function BilingualTextColumns({ titleKey, descriptionKey }: BilingualTextColumnsProps) {
  const { t } = useTranslation(handle.i18nNamespace);
  return (
    <dl className="grid gap-y-3 sm:grid-cols-2 sm:gap-[2.5ch] print:grid-cols-2 print:gap-[2.5ch]">
      <div lang="en">
        <dt className="font-semibold">{t(titleKey, { lng: 'en' })}</dt>
        <dd>{t(descriptionKey, { lng: 'en' })}</dd>
      </div>
      <div lang="fr">
        <dt className="font-semibold">{t(titleKey, { lng: 'fr' })}</dt>
        <dd>{t(descriptionKey, { lng: 'fr' })}</dd>
      </div>
    </dl>
  );
}
