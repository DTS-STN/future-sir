import { Form, redirect } from 'react-router';

import type { Route } from './+types/index';

import { LogFactory } from '~/.server/logging';
import { i18nRedirect } from '~/.server/utils/route-utils';
import { Button } from '~/components/button';
import { PageTitle } from '~/components/page-title';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';
import { createMachineActor, getStateRoute, loadMachineActor } from '~/routes/protected/in-person/state-machine.server';

const log = LogFactory.getLogger(import.meta.url);

export async function action({ context, params, request }: Route.ActionArgs) {
  const actor = loadMachineActor(context.session, request);

  if (!actor) {
    log.warn('Could not find a machine snapshot session; redirecting to start of flow');
    throw i18nRedirect('routes/protected/in-person/index.tsx', request, { search: new URLSearchParams({ restarted: 'true' }) });
  }

  const formData = await request.formData();
  const action = formData.get('action');

  switch (action) {
    case 'next': {
      actor.send({ type: 'next' });
      break;
    }

    default: {
      throw new AppError(`Unrecognized action: ${action}`, ErrorCodes.UNRECOGNIZED_ACTION);
    }
  }

  return redirect(getStateRoute(actor, { context, params, request }));
}

export function loader({ context, params, request }: Route.LoaderArgs) {
  const tabId = new URL(request.url).searchParams.get('tid');
  if (!tabId) return null; // no tab id.. return early and wait for one

  createMachineActor(context.session, request);

  return { tabId };
}

export default function InPersonFlow({ actionData, loaderData, matches, params }: Route.ComponentProps) {
  return (
    <div className="space-y-3">
      <PageTitle>
        <span>In-person flow</span>
        <span className="block text-sm">(tabid: {loaderData?.tabId ?? '...'})</span>
      </PageTitle>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sed nisi a nibh semper mollis. Curabitur feugiat orci
        quis tincidunt iaculis. Curabitur iaculis risus augue, bibendum euismod erat faucibus sed. Praesent maximus, elit a
        viverra blandit, sapien quam condimentum ex, a tincidunt mi nulla non enim. Interdum et malesuada fames ac ante ipsum
        primis in faucibus. Proin efficitur nunc turpis, ac rhoncus tortor molestie sit amet. Proin rutrum semper porta.
        Pellentesque nisi ligula, scelerisque non mauris nec, maximus convallis libero. Vivamus ante nibh, fermentum nec mattis
        non, hendrerit sit amet elit. Pellentesque laoreet est et pellentesque facilisis. Sed vel odio quis risus scelerisque
        auctor sagittis luctus sem. Sed dictum hendrerit odio ut suscipit. Etiam eu tempus nulla, in scelerisque dolor.
      </p>
      <Form method="post" className="mt-8">
        <Button name="action" value="next" variant="primary" size="xl">
          Start
        </Button>
      </Form>
    </div>
  );
}
