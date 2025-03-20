import { useId } from 'react';

import type { AppLoadContext, RouteHandle } from 'react-router';
import { useFetcher } from 'react-router';

import { useTranslation } from 'react-i18next';

import type { Info, Route } from './+types/send-validation';

import { caseApi } from '~/.server/domain/multi-channel/services/case-api-service';
import { requireAuth } from '~/.server/utils/auth-utils';
import { i18nRedirect } from '~/.server/utils/route-utils';
import { Button } from '~/components/button';
import { ContextualAlert } from '~/components/contextual-alert';
import { InlineLink } from '~/components/links';
import { PageTitle } from '~/components/page-title';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';
import { getTranslation } from '~/i18n-config.server';
import { editSectionIds } from '~/routes/protected/multi-channel/edit-application';
import { handle as parentHandle } from '~/routes/protected/person-case/layout';
import { ApplicationReview } from '~/routes/protected/sin-application/application-review';
import { formatSinApplication } from '~/routes/protected/sin-application/validation.server';

export const handle = {
  i18nNamespace: [...parentHandle.i18nNamespace, 'protected'],
} as const satisfies RouteHandle;

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data.documentTitle }];
}

export async function action({ context, params, request }: Route.ActionArgs) {
  requireAuth(context.session, new URL(request.url), ['user']);

  const formData = await request.formData();
  const action = formData.get('action');

  switch (action) {
    case 'send': {
      throw i18nRedirect('routes/protected/multi-channel/pid-verification.tsx', request);
    }
    default: {
      throw new AppError(`Unrecognized action: ${action}`, ErrorCodes.UNRECOGNIZED_ACTION);
    }
  }
}

async function fetchSinCase(context: AppLoadContext, caseId: string) {
  const existingSinCase = context.session.editingSinCase;
  if (existingSinCase && existingSinCase.caseId === caseId) {
    return existingSinCase;
  }
  // TODO: the id will likely come from a path param in the URL?
  const sinCase = await caseApi.getCaseById(caseId);
  context.session.editingSinCase = sinCase;
  return sinCase;
}

export async function loader({ context, request }: Route.LoaderArgs) {
  requireAuth(context.session, new URL(request.url), ['user']);
  const { lang, t } = await getTranslation(request, handle.i18nNamespace);

  const sinCase = await fetchSinCase(context, '00000000000000');

  return {
    documentTitle: t('protected:send-validation.page-title'),
    caseId: sinCase.caseId,
    inPersonSINCase: formatSinApplication(sinCase, lang),
  };
}

export default function SendValidation({ loaderData, actionData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespace);

  const fetcherKey = useId();
  const fetcher = useFetcher<Info['actionData']>({ key: fetcherKey });

  const isSubmitting = fetcher.state !== 'idle';
  const { inPersonSINCase, caseId } = loaderData;

  return (
    <>
      <PageTitle subTitle={t('protected:first-time.title')}>{t('protected:send-validation.page-title')}</PageTitle>
      <ContextualAlert type="info">
        <h3 className="text-lg font-semibold">{t('protected:send-validation.case-created')}</h3>
        <p>{t('protected:send-validation.id-number')}</p>
        <p>{caseId}</p>
      </ContextualAlert>
      <ApplicationReview
        inPersonSINCase={inPersonSINCase}
        primaryDocumentsLink={
          <InlineLink
            file="routes/protected/multi-channel/edit-application.tsx"
            search={`section=${editSectionIds.primaryDocs}`}
          >
            {t('protected:review.edit-primary-identity-document')}
          </InlineLink>
        }
        secondaryDocumentLink={
          <InlineLink
            file="routes/protected/multi-channel/edit-application.tsx"
            search={`section=${editSectionIds.secondaryDoc}`}
          >
            {t('protected:review.edit-secondary-identity-document')}
          </InlineLink>
        }
        currentNameInfoLink={
          <InlineLink
            file="routes/protected/multi-channel/edit-application.tsx"
            search={`section=${editSectionIds.currentName}`}
          >
            {t('protected:review.edit-current-name')}
          </InlineLink>
        }
        personalInformationLink={
          <InlineLink
            file="routes/protected/multi-channel/edit-application.tsx"
            search={`section=${editSectionIds.personalInfo}`}
          >
            {t('protected:review.edit-personal-details')}
          </InlineLink>
        }
        birthDetailsLink={
          <InlineLink
            file="routes/protected/multi-channel/edit-application.tsx"
            search={`section=${editSectionIds.birthDetails}`}
          >
            {t('protected:review.edit-birth-details')}
          </InlineLink>
        }
        parentDetailsLink={
          <InlineLink
            file="routes/protected/multi-channel/edit-application.tsx"
            search={`section=${editSectionIds.parentDetails}`}
          >
            {t('protected:review.edit-parent-details')}
          </InlineLink>
        }
        previousSinLink={
          <InlineLink
            file="routes/protected/multi-channel/edit-application.tsx"
            search={`section=${editSectionIds.previousSin}`}
          >
            {t('protected:review.edit-previous-sin')}
          </InlineLink>
        }
        contactInformationLink={
          <InlineLink
            file="routes/protected/multi-channel/edit-application.tsx"
            search={`section=${editSectionIds.contactInformation}`}
          >
            {t('protected:review.edit-contact-information')}
          </InlineLink>
        }
      />
      <fetcher.Form className="max-w-prose" method="post" noValidate>
        <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <Button name="action" value="send" variant="primary" id="send-for-validation" disabled={isSubmitting}>
            {t('protected:send-validation.send-for-validation')}
          </Button>
        </div>
      </fetcher.Form>
    </>
  );
}
