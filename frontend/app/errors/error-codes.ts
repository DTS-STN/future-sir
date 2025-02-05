export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export const ErrorCodes = {
  UNCAUGHT_ERROR: 'UNC-0000',

  // auth error codes
  MISCONFIGURED_PROVIDER: 'AUTH-0001',
  ACCESS_FORBIDDEN: 'AUTH-0002',
  MISSING_AUTH_HEADER: 'AUTH-0003',
  DISCOVERY_ENDPOINT_MISSING: 'AUTH-0004',

  // component error codes
  MISSING_LANG_PARAM: 'CMP-0001',

  // form error codes
  UNRECOGNIZED_ACTION: 'FRM-0001',

  // FSM error codes
  MISSING_TAB_ID: 'FSM-0001',
  MISSING_META: 'FSM-0002',
  MISSING_SNAPSHOT: 'FSM-0003',

  // i18n error codes
  NO_LANGUAGE_FOUND: 'I18N-0001',

  // instance error codes
  NO_FACTORY_PROVIDED: 'INST-0001',

  // route error codes
  ROUTE_NOT_FOUND: 'RTE-0001',

  // validation error codes
  INVALID_NUMBER: 'VAL-0001',

  // dev-only error codes
  TEST_ERROR_CODE: 'DEV-0001',
} as const;
