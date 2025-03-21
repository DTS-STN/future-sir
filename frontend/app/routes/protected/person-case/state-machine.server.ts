import type { ActionFunctionArgs } from 'react-router';
import { generatePath } from 'react-router';

import type { Actor } from 'xstate';
import { assign, createActor, setup } from 'xstate';

import { LogFactory } from '~/.server/logging';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';
import type { I18nRouteFile } from '~/i18n-routes';
import { i18nRoutes } from '~/i18n-routes';
import type {
  BirthDetailsData,
  ContactInformationData,
  CurrentNameData,
  FormData,
  InPersonSinApplication,
  ParentDetailsData,
  PersonalInfoData,
  PreviousSinData,
  PrimaryDocumentData,
  PrivacyStatementData,
  RequestDetailsData,
  SecondaryDocumentData,
} from '~/routes/protected/person-case/state-machine-models';
import { getLanguage } from '~/utils/i18n-utils';
import { getRouteByFile } from '~/utils/route-utils';

export type Machine = typeof machine;

type MachineContext = Partial<InPersonSinApplication> & Partial<{ formData: FormData }>;

type MachineEvents =
  | { type: 'prev' }
  | { type: 'cancel' }
  | { type: 'exit' }
  | { type: 'setFormData'; data: FormData }
  | { type: 'submitBirthDetails'; data: BirthDetailsData }
  | { type: 'submitContactInfo'; data: ContactInformationData }
  | { type: 'submitCurrentName'; data: CurrentNameData }
  | { type: 'submitParentDetails'; data: ParentDetailsData }
  | { type: 'submitPersonalInfo'; data: PersonalInfoData }
  | { type: 'submitPreviousSin'; data: PreviousSinData }
  | { type: 'submitPrimaryDocuments'; data: PrimaryDocumentData }
  | { type: 'submitPrivacyStatement'; data: PrivacyStatementData }
  | { type: 'submitRequestDetails'; data: RequestDetailsData }
  | { type: 'submitSecondaryDocuments'; data: SecondaryDocumentData }
  | { type: 'submitReview' };

type MachineMeta = {
  route: I18nRouteFile;
};

/**
 * Type representing the possible state names for the application process.
 * TODO ::: GjB ::: figure out if there is a way to infer these from the machine.
 */
export type StateName =
  | 'privacy-statement'
  | 'request-details'
  | 'primary-docs'
  | 'secondary-docs'
  | 'name-info'
  | 'personal-info'
  | 'birth-info'
  | 'parent-info'
  | 'previous-sin-info'
  | 'contact-info'
  | 'review';

const log = LogFactory.getLogger(import.meta.url);

const machineId = 'person-case';

const initialContext = {
  formData: undefined,
  birthDetails: undefined,
  contactInformation: undefined,
  currentNameInfo: undefined,
  parentDetails: undefined,
  personalInformation: undefined,
  previousSin: undefined,
  primaryDocuments: undefined,
  privacyStatement: undefined,
  requestDetails: undefined,
  secondaryDocument: undefined,
} satisfies MachineContext;

export const machine = setup({
  types: {
    context: {} as MachineContext,
    events: {} as MachineEvents,
    meta: {} as MachineMeta,
  },
}).createMachine({
  id: machineId,
  initial: 'privacy-statement',
  context: initialContext,
  on: {
    cancel: {
      target: '.privacy-statement',
      actions: assign(initialContext),
    },
    exit: {
      target: '.exited',
    },
    setFormData: {
      actions: assign(({ context, event }) => ({
        formData: { ...context.formData, ...event.data },
      })),
    },
  },
  states: {
    'exited': { type: 'final' },
    'privacy-statement': {
      meta: { route: 'routes/protected/person-case/privacy-statement.tsx' },
      on: {
        submitPrivacyStatement: {
          target: 'request-details',
          actions: assign(({ context, event }) => ({
            formData: { ...context.formData, privacyStatement: undefined },
            privacyStatement: event.data,
          })),
        },
      },
    },
    'request-details': {
      meta: { route: 'routes/protected/person-case/request-details.tsx' },
      on: {
        prev: {
          target: 'privacy-statement',
        },
        submitRequestDetails: {
          target: 'primary-docs',
          actions: assign(({ context, event }) => ({
            formData: { ...context.formData, requestDetails: undefined },
            requestDetails: event.data,
          })),
        },
      },
    },
    'primary-docs': {
      meta: { route: 'routes/protected/person-case/primary-docs.tsx' },
      on: {
        prev: {
          target: 'request-details',
        },
        submitPrimaryDocuments: {
          target: 'secondary-docs',
          actions: assign(({ context, event }) => ({
            formData: { ...context.formData, primaryDocuments: undefined },
            primaryDocuments: event.data,
          })),
        },
      },
    },
    'secondary-docs': {
      meta: { route: 'routes/protected/person-case/secondary-doc.tsx' },
      on: {
        prev: {
          target: 'primary-docs',
        },
        submitSecondaryDocuments: {
          target: 'name-info',
          actions: assign(({ context, event }) => ({
            formData: { ...context.formData, secondaryDocument: undefined },
            secondaryDocument: event.data,
          })),
        },
      },
    },
    'name-info': {
      meta: { route: 'routes/protected/person-case/current-name.tsx' },
      on: {
        prev: {
          target: 'secondary-docs',
        },
        submitCurrentName: {
          target: 'personal-info',
          actions: assign(({ context, event }) => ({
            currentNameInfo: event.data,
          })),
        },
      },
    },
    'personal-info': {
      meta: { route: 'routes/protected/person-case/personal-info.tsx' },
      on: {
        prev: {
          target: 'name-info',
        },
        submitPersonalInfo: {
          target: 'birth-info',
          actions: assign(({ context, event }) => ({
            formData: { ...context.formData, personalInformation: undefined },
            personalInformation: event.data,
          })),
        },
      },
    },
    'birth-info': {
      meta: { route: 'routes/protected/person-case/birth-details.tsx' },
      on: {
        prev: {
          target: 'personal-info',
        },
        submitBirthDetails: {
          target: 'parent-info',
          actions: assign(({ context, event }) => ({
            formData: { ...context.formData, birthDetails: undefined },
            birthDetails: event.data,
          })),
        },
      },
    },
    'parent-info': {
      meta: { route: 'routes/protected/person-case/parent-details.tsx' },
      on: {
        prev: {
          target: 'birth-info',
        },
        submitParentDetails: {
          target: 'previous-sin-info',
          actions: assign(({ context, event }) => ({
            formData: { ...context.formData, parentDetails: undefined },
            parentDetails: event.data,
          })),
        },
      },
    },
    'previous-sin-info': {
      meta: { route: 'routes/protected/person-case/previous-sin.tsx' },
      on: {
        prev: {
          target: 'parent-info',
        },
        submitPreviousSin: {
          target: 'contact-info',
          actions: assign(({ context, event }) => ({
            formData: { ...context.formData, previousSin: undefined },
            previousSin: event.data,
          })),
        },
      },
    },
    'contact-info': {
      meta: { route: 'routes/protected/person-case/contact-information.tsx' },
      on: {
        prev: {
          target: 'previous-sin-info',
        },
        submitContactInfo: {
          target: 'review',
          actions: assign(({ context, event }) => ({
            formData: { ...context.formData, contactInformation: undefined },
            contactInformation: event.data,
          })),
        },
      },
    },
    'review': {
      meta: { route: 'routes/protected/person-case/review.tsx' },
      on: {
        prev: {
          target: 'contact-info',
        },
        submitReview: {
          target: 'privacy-statement',
          actions: assign(({ context, event }) => ({
            // TODO ::: GjB ::: handle final submission
          })),
        },
      },
    },
  },
});

/**
 * Creates a new in-person application state machine actor and stores it in the session.
 *
 * This function creates a new XState actor for the in-person application flow, subscribes
 * to its state changes to persist the snapshot in the session, and starts the actor.
 * @param session - The current application session
 * @param flowId - The flow ID to create
 */
export function createMachineActor(session: AppSession, flowId: string): Actor<Machine> {
  const flow = (session.inPersonSinApplications ??= {}); // ensure session container exists

  const actor = createActor(machine, { id: flowId });
  actor.subscribe((snapshot) => void (flow[flowId] = snapshot));
  log.debug('Created new in-person state machine for session [%s] and flowId [%s]', session.id, flowId);

  return actor.start();
}

/**
 * Loads an existing in-person application state machine actor from the session.
 *
 * This function attempts to load a persisted XState actor snapshot from the session,
 * and recreates the actor with the loaded snapshot.
 * @param session - The current application session
 * @param flowId - The flow ID to load
 */
export function loadMachineActor(session: AppSession, flowId: string, stateName?: StateName): Actor<Machine> | undefined {
  const flows = (session.inPersonSinApplications ??= {}); // ensure session container exists
  const flow = flows[flowId];

  if (!flow) {
    log.debug('Could not find a machine snapshot session; returning undefined');
    return undefined;
  }

  // if a desired state name has been provided, we load it,
  // otherwise use the state name that has been stored in session
  const snapshot = stateName ? machine.resolveState({ value: stateName, context: flow.context }) : flow;

  const actor = createActor(machine, { id: flowId, snapshot });
  actor.subscribe((snapshot) => void (flows[flowId] = snapshot));
  log.debug('Loaded in-person state machine for session [%s] and flowId [%s]', session.id, flowId);

  return actor.start();
}

/**
 * Generates a URL for a given machine state and arguments.
 *
 * This function determines the appropriate route based on the current machine state,
 * language, and provided arguments. It retrieves metadata associated with the state,
 * uses it to find the correct route definition, and constructs the URL using the provided
 * parameters. It throws an error if the language cannot be determined from the request
 * or if the metadata for the current machine state cannot be found.
 *
 * @throws {AppError} If the language or metadata cannot be determined.
 */
export function getStateRoute(actor: Actor<Machine>, { params, request }: ActionFunctionArgs): string {
  const language = getLanguage(request);

  if (!language) {
    throw new AppError(
      'The current language could not be determined from the request', //
      ErrorCodes.MISSING_LANG_PARAM,
    );
  }

  const snapshot = actor.getSnapshot();
  const meta = snapshot.getMeta()[`${machineId}.${snapshot.value}`];

  if (!meta) {
    // this should never happen if the state machine is configured correctly
    throw new AppError('The metadata for the current machine state could not be determined', ErrorCodes.MISSING_META);
  }

  const url = new URL(request.url);
  const { paths } = getRouteByFile(meta.route, i18nRoutes);
  url.pathname = generatePath(paths[language], params);

  return url.toString();
}
