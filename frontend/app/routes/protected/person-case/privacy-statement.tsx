import { data, useFetcher } from 'react-router';
import type { RouteHandle } from 'react-router';

import { faXmark, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import * as v from 'valibot';

import type { Route, Info } from './+types/privacy-statement';

import { requireAuth } from '~/.server/utils/auth-utils';
import { i18nRedirect } from '~/.server/utils/route-utils';
import { Button } from '~/components/button';
import { ErrorSummary } from '~/components/error-summary';
import { InputCheckbox } from '~/components/input-checkbox';
import { PageTitle } from '~/components/page-title';
import { Progress } from '~/components/progress';
import { getFixedT } from '~/i18n-config.server';
import { handle as parentHandle } from '~/routes/protected/layout';
import { getLanguage } from '~/utils/i18n-utils';

export const handle = {
  i18nNamespace: [...parentHandle.i18nNamespace, 'protected'],
} as const satisfies RouteHandle;

export async function loader({ context, request }: Route.LoaderArgs) {
  requireAuth(context.session, new URL(request.url), ['user']);
  const t = await getFixedT(request, handle.i18nNamespace);

  return {
    documentTitle: t('protected:privacy-statement.page-title'),
    defaultFormValues: {
      confirmPrivacyNotice: context.session.inPersonSINCase?.confirmPrivacyNotice,
    },
  };
}

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data.documentTitle }];
}

export async function action({ context, request }: Route.ActionArgs) {
  requireAuth(context.session, new URL(request.url), ['user']);
  const lang = getLanguage(request);
  const t = await getFixedT(request, handle.i18nNamespace);
  const formData = await request.formData();

  if (formData.get('action') === 'back') {
    throw i18nRedirect('routes/protected/index.tsx', request);
  }

  // submit action
  const schema = v.object({
    confirmPrivacyNotice: v.pipe(
      v.string(t('protected:privacy-statement.confirm-privacy-notice-checkbox.required')),
      v.trim(),
      v.nonEmpty(t('protected:privacy-statement.confirm-privacy-notice-checkbox.required')),
    ),
  });

  const input = { confirmPrivacyNotice: formData.get('confirmPrivacyNotice') as string };
  const parsedDataResult = v.safeParse(schema, input, { lang });

  if (!parsedDataResult.success) {
    return data({ errors: v.flatten<typeof schema>(parsedDataResult.issues).nested }, { status: 400 });
  }

  context.session.inPersonSINCase = {
    ...(context.session.inPersonSINCase ?? {}),
    ...input,
  };

  throw i18nRedirect('routes/protected/person-case/first-name.tsx', request); //TODO: change it to redirect to file="routes/protected/person-case/request-details.tsx"
}

export default function PrivacyStatement({ loaderData, actionData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespace);

  const fetcher = useFetcher<Info['actionData']>();
  const isSubmitting = fetcher.state !== 'idle';
  const errors = fetcher.data?.errors;

  return (
    <>
      <div className="flex justify-end">
        <Button id="abandon-button" endIcon={faXmark} variant="link">
          {t('protected:person-case.abandon-button')}
        </Button>
        <Button id="refer-button" endIcon={faExclamationCircle} variant="link">
          {t('protected:person-case.refer-button')}
        </Button>
      </div>
      <Progress className="mt-8" label="" value={20} />
      <PageTitle subTitle={t('protected:in-person.title')}>{t('protected:privacy-statement.page-title')}</PageTitle>

      <fetcher.Form method="post" noValidate>
        <div className="space-y-6">
          <ErrorSummary errors={errors} />
          <p>
            Lorem ipsum odor amet, consectetuer adipiscing elit. Gravida pulvinar fringilla augue per lacinia cubilia aliquam.
            Nibh egestas pharetra; at sit ipsum aliquet fames pellentesque. Posuere mauris pretium commodo hendrerit maecenas
            neque imperdiet. Phasellus tempor metus phasellus eu malesuada. Mi fusce dapibus nam metus est sagittis nisl sem
            fringilla. Iaculis gravida netus aptent mattis dignissim massa. Dolor curae donec hac dui, neque proin erat. Nullam
            sem ullamcorper commodo phasellus hendrerit ex. Curabitur venenatis ex, vitae fermentum finibus nibh.
          </p>

          <p>
            Himenaeos turpis id pretium mauris pellentesque quis curae. Facilisi sollicitudin justo erat habitasse turpis
            consequat taciti. Scelerisque suspendisse hac dictumst mattis in odio. Molestie molestie parturient arcu iaculis
            lacinia. Ut est vel massa fusce congue laoreet posuere pulvinar. Consectetur pharetra ipsum tortor cubilia ut.
            Placerat a pellentesque commodo bibendum posuere vivamus. Senectus imperdiet sit praesent adipiscing accumsan nibh
            consequat per. Aliquam turpis ut libero non malesuada tortor ac maximus dictum. Non vestibulum pellentesque posuere
            dapibus eleifend cras tempus potenti.
          </p>

          <p>
            Rhoncus semper dolor; scelerisque euismod justo integer. Rhoncus et cras cursus velit diam. Vehicula magna sem eget
            urna vitae donec phasellus dignissim volutpat. Arcu mi neque ad nulla; dui maximus. Nulla ligula ultrices facilisi
            urna rhoncus platea per platea. Nascetur nec dapibus augue dictum volutpat tristique nec dis. Dis ante metus tortor
            lacus porta.
          </p>

          <InputCheckbox
            id="confirmPrivacyNotice"
            name="confirmPrivacyNotice"
            errorMessage={errors?.confirmPrivacyNotice?.[0]}
            defaultChecked={loaderData.defaultFormValues.confirmPrivacyNotice === 'on'}
            required
          >
            {t('protected:privacy-statement.confirm-privacy-notice-checkbox.title')}
          </InputCheckbox>
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button name="action" value="back" id="back-button" disabled={isSubmitting}>
            {t('protected:person-case.previous')}
          </Button>
          <Button name="action" value="next" variant="primary" id="continue-button" disabled={isSubmitting}>
            {t('protected:person-case.next')}
          </Button>
        </div>
      </fetcher.Form>
    </>
  );
}
