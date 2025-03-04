import type { ReactNode } from 'react';
import { useId, useRef } from 'react';

import type { RouteHandle } from 'react-router';
import { useFetcher } from 'react-router';

import { useTranslation } from 'react-i18next';

import type { Info, Route } from './+types/sin-confirmation';

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
      sinNumber: '123456789',
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
  const contentRef = useRef<HTMLDivElement>(null);
  const recordDetails = loaderData.recordDetails;
  const { dateEn, dateFr } = dateToLocalizedText();

  return (
    <>
      <PageTitle className="print:hidden" subTitleClassName="print:hidden" subTitle={t('protected:first-time.title')}>
        {t('protected:sin-confirmation.page-title')}
      </PageTitle>
      <div className="space-y-8 print:m-3 print:text-xs" ref={contentRef}>
        <div className="grid items-center gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 print:grid-cols-3 print:sm:grid-cols-4">
          <dl className="flex items-center">
            <dt className="mr-[1ch]">Date:</dt>
            <dd className="font-semibold">
              <EnglishFrenchText en={dateEn} fr={dateFr} />
            </dd>
          </dl>
          <p className="font-semibold">
            <EnglishFrenchText en="PROTECTED B" fr="PROTÉGÉ B" />
          </p>
        </div>
        <section>
          <h3 className="text-center font-semibold">
            <EnglishFrenchText en="Social Insurance Number (SIN)" fr="Numéro d'assurance sociale (NAS)" />:
          </h3>
          <p className="mt-4 text-center font-semibold">
            {recordDetails.sinNumber.slice(0, 3)}
            <span className="mx-[0.5ch]">-</span>
            {recordDetails.sinNumber.slice(3, 6)}
            <span className="mx-[0.5ch]">-</span>
            {recordDetails.sinNumber.slice(6, 9)}
          </p>
        </section>
        <section>
          <h3 className="text-center font-semibold">
            <EnglishFrenchText en="Names on the SIN record" fr="Noms au dossier de NAS" />
          </h3>
          <dl className="mt-5 grid items-center gap-5">
            <ConfirmationDetail en="First Name" fr="Prénom">
              {recordDetails.firstName}
            </ConfirmationDetail>
            <ConfirmationDetail en="Middle Name(s)" fr="Second(s) prénom(s)">
              {recordDetails.middleNames.map((name, index) => (
                <span key={index} className="block">
                  {name}
                </span>
              ))}
            </ConfirmationDetail>
            <ConfirmationDetail en="Family Name(s)" fr="Nom(s) de famile">
              {recordDetails.familyNames.map((name, index) => (
                <span key={index} className="block">
                  {name}
                </span>
              ))}
            </ConfirmationDetail>
            <ConfirmationDetail en="Address" fr="Adresse">
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
          <EnglishFrenchColumns
            enTitle="Protect your SIN; it is confidential"
            enDescription="Keep any document containing your SIN in a safe place."
            frTitle="Protégez votre NAS, il est confidentiel"
            frDescription="Conservez tout document où i'on retrouve votre NAS dans un enroit sûr."
          />
          <EnglishFrenchColumns
            enTitle="Use of your SIN"
            enDescription="You are required to provide your SIN to your employer within three days after the day you receive it.
              Also, some programs and/or services authenticate a person's identity using data on the SIN record;
              ensure you are using the names as shown above"
            frTitle="Utilisation de votre NAS"
            frDescription="Vous devez fournir votre NAS à votre employeur dans les trois jours suivant sa recéption.
              Aussi, centains programmes et/ou services utilisent les données au dossier de NAS afin d'authentifier i'dentité d'une personne.
              Assurez-vous d'utiliser les noms qui figurent ci-dessus."
          />
          <EnglishFrenchColumns
            enTitle="If your SIN begins with the number 9"
            enDescription="You must present a valid proof of authorization to work in Canada to your employer.
              Your SIN record must be updated to reflect the most recent expiry date."
            frTitle="Si votre NAS débute par le chiffre 9"
            frDescription="Vous devez présenter à votre employeur une autorisation valide vous permettant de travailler au Canada.
              Votre dossier de NAS doit être mis à jour afin de refléter la plus récente date d'expiration."
          />
          <EnglishFrenchColumns
            enTitle="For more information, visit our Web site:"
            enDescription="Canada.ca/social-insurance-number"
            frTitle="Pour plus de renseignements, consultez notre site Web :"
            frDescription="Canada.ca/numero-assurance-sociale"
          />
        </section>
      </div>
      <fetcher.Form method="post" noValidate className="mt-12 space-x-3 print:hidden">
        <Button type="button" variant="primary" onClick={() => print()}>
          {t('protected:sin-confirmation.print')}
        </Button>
        <Button name="action" value="finish" id="finish-button" disabled={isSubmitting}>
          {t('protected:sin-confirmation.finish')}
        </Button>
      </fetcher.Form>
    </>
  );
}

interface EnglishFrenchTextProps {
  en: string;
  fr: string;
}

function EnglishFrenchText({ en, fr }: EnglishFrenchTextProps) {
  return (
    <>
      {en}
      <span className="mx-[0.5ch]">/</span>
      {fr}
    </>
  );
}

interface ConfirmationDetailProps {
  en: string;
  fr: string;
  children: ReactNode;
}

function ConfirmationDetail({ en, fr, children }: ConfirmationDetailProps) {
  return (
    <div className="grid sm:grid-cols-2 sm:gap-[2.5ch] print:grid-cols-2 print:gap-[2.5ch]">
      <dt className="mt-0 mb-auto flex items-center">
        <EnglishFrenchText en={en} fr={fr} />:
      </dt>
      <dd className="font-semibold">
        <span className="block">{children}</span>
      </dd>
    </div>
  );
}

interface EnglishFrenchColumnsProps {
  enTitle: string;
  enDescription: string;
  frTitle: string;
  frDescription: string;
}

function EnglishFrenchColumns({ enTitle, enDescription, frTitle, frDescription }: EnglishFrenchColumnsProps) {
  return (
    <dl className="grid gap-y-3 sm:grid-cols-2 sm:gap-[2.5ch] print:grid-cols-2 print:gap-[2.5ch]">
      <div>
        <dt className="font-semibold">{enTitle}</dt>
        <dd>{enDescription}</dd>
      </div>
      <div>
        <dt className="font-semibold">{frTitle}</dt>
        <dd>{frDescription}</dd>
      </div>
    </dl>
  );
}
