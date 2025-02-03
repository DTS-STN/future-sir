import { data, useFetcher } from 'react-router';
import type { RouteHandle } from 'react-router';

import { faXmark, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import * as v from 'valibot';

import type { Route, Info } from './+types/privacy-statement';

import { requireAuth } from '~/.server/utils/auth-utils';
import { i18nRedirect } from '~/.server/utils/route-utils';
import { confirmPrivacyNoticeSchema } from '~/.server/validation/confirmPrivacyNoticeSchema';
import { Button } from '~/components/button';
import { ButtonLink } from '~/components/button-link';
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

export const meta: Route.MetaFunction = ({ data }) => {
  return [{ title: data.documentTitle }];
};

export async function action({ context, request }: Route.ActionArgs) {
  requireAuth(context.session, new URL(request.url), ['user']);
  const lang = getLanguage(request);

  const formData = await request.formData();
  const input = { confirmPrivacyNotice: formData.get('confirmPrivacyNotice') as string };

  const schema = v.object({ confirmPrivacyNotice: confirmPrivacyNoticeSchema() });
  const parsedDataResult = v.safeParse(schema, input, { lang });

  if (!parsedDataResult.success) {
    return data({ errors: v.flatten<typeof schema>(parsedDataResult.issues).nested }, { status: 400 });
  }

  // If the first name is valid, store it in the session and redirect to the next page
  context.session.inPersonSINCase = {
    ...(context.session.inPersonSINCase ?? {}),
    ...input,
  };
  return i18nRedirect('routes/protected/person-case/first-name.tsx', request);
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
            {t('protected:privacy-statement.confirm-privacy-notice-checkbox')}
          </InputCheckbox>
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <ButtonLink id="back-button" file="routes/protected/index.tsx" params={params} disabled={isSubmitting}>
            {t('protected:person-case.previous')}
          </ButtonLink>
          <Button variant="primary" type="submit" id="continue-button" disabled={isSubmitting}>
            {t('protected:person-case.next')}
          </Button>
        </div>
      </fetcher.Form>
    </>
  );
}
