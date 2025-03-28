import 'express-session';
import type { SnapshotFrom } from 'xstate';

import type { Machine } from '~/routes/protected/person-case/state-machine.server';
import type {
  BirthDetailsData,
  ContactInformationData,
  CurrentNameData,
  Errors,
  ParentDetailsData,
  PersonalInfoData,
  PreviousSinData,
  PrimaryDocumentData,
  PrivacyStatementData,
  RequestDetailsData,
  SecondaryDocumentData,
} from '~/routes/protected/sin-application/form-models';

export type FormData = {
  [K in keyof InPersonSinApplication]?: {
    values?: Partial<InPersonSinApplication[K]>;
    errors?: Errors;
  };
};

export type InPersonSinApplication = {
  birthDetails: BirthDetailsData;
  contactInformation: ContactInformationData;
  currentNameInfo: CurrentNameData;
  parentDetails: ParentDetailsData;
  personalInformation: PersonalInfoData;
  previousSin: PreviousSinData;
  primaryDocuments: PrimaryDocumentData;
  privacyStatement: PrivacyStatementData;
  requestDetails: RequestDetailsData;
  secondaryDocument: SecondaryDocumentData;
};

declare module 'express-session' {
  interface SessionData {
    inPersonSinApplications: Record<string, SnapshotFrom<Machine> | undefined>;
  }
}

export {};
