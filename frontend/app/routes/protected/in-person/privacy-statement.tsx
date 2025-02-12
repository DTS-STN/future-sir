import { Form, redirect } from 'react-router';

import type { Route } from './+types/privacy-statement';

import { LogFactory } from '~/.server/logging';
import { i18nRedirect } from '~/.server/utils/route-utils';
import { Button } from '~/components/button';
import { PageTitle } from '~/components/page-title';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';
import { getStateRoute, loadMachineActor } from '~/routes/protected/in-person/state-machine.server';

const log = LogFactory.getLogger(import.meta.url);

export async function action({ context, params, request }: Route.ActionArgs) {
  const actor = loadMachineActor(context.session, request, 'privacy-statement');

  if (!actor) {
    log.warn('Could not find a machine snapshot session; redirecting to start of flow');
    throw i18nRedirect('routes/protected/in-person/index.tsx', request, { search: new URLSearchParams({ restarted: 'true' }) });
  }

  const formData = await request.formData();
  const action = formData.get('action');

  switch (action) {
    case 'cancel': {
      actor.send({ type: 'cancel' });
      break;
    }

    case 'next': {
      actor.send({ type: 'next' });
      break;
    }

    default: {
      throw new AppError(`Unrecognized action: ${action}`, ErrorCodes.UNRECOGNIZED_ACTION);
    }
  }

  throw redirect(getStateRoute(actor, { context, params, request }));
}

export function loader({ context, params, request }: Route.LoaderArgs) {
  const tabId = new URL(request.url).searchParams.get('tid');
  if (!tabId) return null; // no tab id.. return early and wait for one

  if (!loadMachineActor(context.session, request, 'privacy-statement')) {
    log.warn('Could not find a machine snapshot session; redirecting to start of flow');
    throw i18nRedirect('routes/protected/in-person/index.tsx', request, { search: new URLSearchParams({ restarted: 'true' }) });
  }

  return { tabId };
}

export default function PrivacyStatement({ actionData, loaderData, matches, params }: Route.ComponentProps) {
  return (
    <div className="space-y-3">
      <PageTitle>
        <span>Protection of information</span>
        <span className="block text-sm">(tabid: {loaderData?.tabId ?? '...'})</span>
      </PageTitle>
      <p>
        The personal information you provide is collected under the authority of the Employment Insurance Act (EIA) and the
        Department of Employment and Social Development Act (DESDA) for the purpose of assigning a Social Insurance Number (SIN)
        to you or your child.
      </p>
      <p>
        Participation is voluntary; however, refusal to provide your personal information will result in you or your child not
        receiving a SIN. The information you provide may be shared with federal departments and agencies that are authorized
        users of the SIN and in accordance with the Treasury Board Secretariat Directive on the Social Insurance Number for the
        administration of benefits and services; and/or with federal and provincial departments for the administration and
        enforcement of the legislation for which they are responsible.
      </p>
      <p>
        The information and documents you provide may also be verified with provincial and territorial vital statistics
        registers or Immigration, Refugees and Citizenship Canada records. The information may also be used and/or disclosed for
        policy analysis, research and/or evaluation purposes, however, these additional uses and/or disclosures of your personal
        information will not result in an administrative decision being made about you.
      </p>
      <p>
        You have the right to the protection of, access to, and correction of your personal information, which is described in
        Personal Information Bank (ESDC PPU 390 Social Insurance Number Register) of the government publication Info Source.
        Instructions for obtaining this information are available online at Info Source, (which is available at the following
        web site address: Canada.ca/infosource-ESDC). Info Source may also be accessed online at any Service Canada Centre. You
        have the right to file a complaint with the Privacy Commissioner of Canada regarding the institution&apos;s handling of
        your personal information.
      </p>
      <Form method="post" className="mt-8">
        <div className="space-x-3">
          <Button name="action" value="cancel" variant="red" size="xl">
            Cancel
          </Button>
          <Button name="action" value="next" variant="primary" size="xl">
            Next
          </Button>
        </div>
      </Form>
    </div>
  );
}
