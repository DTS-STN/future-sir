import { useId } from 'react';

import type { RouteHandle } from 'react-router';
import { data, redirect, useFetcher } from 'react-router';

import { useTranslation } from 'react-i18next';
import * as v from 'valibot';

import type { Info, Route } from './+types/privacy-statement';

import { LogFactory } from '~/.server/logging';
import { requireAuth } from '~/.server/utils/auth-utils';
import { i18nRedirect } from '~/.server/utils/route-utils';
import { Button } from '~/components/button';
import { FetcherErrorSummary } from '~/components/error-summary';
import { InputCheckbox } from '~/components/input-checkbox';
import { PageTitle } from '~/components/page-title';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';
import { getTranslation } from '~/i18n-config.server';
import { handle as parentHandle } from '~/routes/protected/person-case/layout';
import { createMachineActor, getStateRoute, loadMachineActor } from '~/routes/protected/person-case/state-machine';
import type { PrivacyStatementData } from '~/routes/protected/person-case/types';

const log = LogFactory.getLogger(import.meta.url);

export const handle = {
  i18nNamespace: [...parentHandle.i18nNamespace, 'protected'],
} as const satisfies RouteHandle;

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data.documentTitle }];
}

export async function action({ context, params, request }: Route.ActionArgs) {
  requireAuth(context.session, new URL(request.url), ['user']);

  const machineActor = loadMachineActor(context.session, request, 'privacy-statement');

  if (!machineActor) {
    log.warn('Could not find a machine snapshot in session; redirecting to start of flow');
    throw i18nRedirect('routes/protected/person-case/privacy-statement.tsx', request);
  }

  const formData = await request.formData();
  const action = formData.get('action');

  switch (action) {
    case 'next': {
      const { lang, t } = await getTranslation(request, handle.i18nNamespace);

      const schema = v.object({
        agreedToTerms: v.literal(true, t('protected:privacy-statement.confirm-privacy-notice-checkbox.required')),
      }) satisfies v.GenericSchema<PrivacyStatementData>;

      const input = {
        agreedToTerms: formData.get('agreedToTerms') ? true : undefined,
      } satisfies Partial<PrivacyStatementData>;

      const parseResult = v.safeParse(schema, input, { lang });

      if (!parseResult.success) {
        return data({ errors: v.flatten<typeof schema>(parseResult.issues).nested }, { status: 400 });
      }

      machineActor.send({ type: 'submitPrivacyStatement', data: parseResult.output });
      break;
    }

    default: {
      throw new AppError(`Unrecognized action: ${action}`, ErrorCodes.UNRECOGNIZED_ACTION);
    }
  }

  throw redirect(getStateRoute(machineActor, { params, request }));
}

export async function loader({ context, request }: Route.LoaderArgs) {
  requireAuth(context.session, new URL(request.url), ['user']);

  if (new URL(request.url).searchParams.get('tid')) {
    // we can create the machine actor only when a tab id exists
    createMachineActor(context.session, request);
  }

  const { t } = await getTranslation(request, handle.i18nNamespace);
  return { documentTitle: t('protected:privacy-statement.page-title') };
}

export default function PrivacyStatement({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespace);

  const fetcherKey = useId();
  const fetcher = useFetcher<Info['actionData']>({ key: fetcherKey });

  const isSubmitting = fetcher.state !== 'idle';
  const errors = fetcher.data?.errors;

  return (
    <>
      <PageTitle subTitle={t('protected:in-person.title')}>{t('protected:privacy-statement.page-title')}</PageTitle>

      <FetcherErrorSummary fetcherKey={fetcherKey}>
        <fetcher.Form method="post" noValidate>
          <div className="space-y-6">
            <p>
              Lorem ipsum odor amet, consectetuer adipiscing elit. Gravida pulvinar fringilla augue per lacinia cubilia aliquam.
              Nibh egestas pharetra; at sit ipsum aliquet fames pellentesque. Posuere mauris pretium commodo hendrerit maecenas
              neque imperdiet. Phasellus tempor metus phasellus eu malesuada. Mi fusce dapibus nam metus est sagittis nisl sem
              fringilla. Iaculis gravida netus aptent mattis dignissim massa. Dolor curae donec hac dui, neque proin erat.
              Nullam sem ullamcorper commodo phasellus hendrerit ex. Curabitur venenatis ex, vitae fermentum finibus nibh.
            </p>

            <p>
              Himenaeos turpis id pretium mauris pellentesque quis curae. Facilisi sollicitudin justo erat habitasse turpis
              consequat taciti. Scelerisque suspendisse hac dictumst mattis in odio. Molestie molestie parturient arcu iaculis
              lacinia. Ut est vel massa fusce congue laoreet posuere pulvinar. Consectetur pharetra ipsum tortor cubilia ut.
              Placerat a pellentesque commodo bibendum posuere vivamus. Senectus imperdiet sit praesent adipiscing accumsan nibh
              consequat per. Aliquam turpis ut libero non malesuada tortor ac maximus dictum. Non vestibulum pellentesque
              posuere dapibus eleifend cras tempus potenti.
            </p>

            <p>
              Rhoncus semper dolor; scelerisque euismod justo integer. Rhoncus et cras cursus velit diam. Vehicula magna sem
              eget urna vitae donec phasellus dignissim volutpat. Arcu mi neque ad nulla; dui maximus. Nulla ligula ultrices
              facilisi urna rhoncus platea per platea. Nascetur nec dapibus augue dictum volutpat tristique nec dis. Dis ante
              metus tortor lacus porta.
            </p>

            <InputCheckbox
              id="agreed-to-terms"
              name="agreedToTerms"
              errorMessage={errors?.agreedToTerms?.at(0)}
              required={true}
            >
              {t('protected:privacy-statement.confirm-privacy-notice-checkbox.title')}
            </InputCheckbox>
          </div>
          <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
            <Button name="action" value="next" variant="primary" id="continue-button" disabled={isSubmitting}>
              {t('protected:person-case.next')}
            </Button>
          </div>
        </fetcher.Form>
      </FetcherErrorSummary>
    </>
  );
}
