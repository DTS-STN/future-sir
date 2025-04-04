export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export const ErrorCodes = {
  UNCAUGHT_ERROR: 'UNC-0000',

  // auth error codes
  MISCONFIGURED_PROVIDER: 'AUTH-0001',
  ACCESS_FORBIDDEN: 'AUTH-0002',
  MISSING_AUTH_HEADER: 'AUTH-0003',
  DISCOVERY_ENDPOINT_MISSING: 'AUTH-0004',
  MISSING_ID_TOKEN: 'AUTH-0005',

  // component error codes
  MISSING_LANG_PARAM: 'CMP-0001',

  // form error codes
  MISSING_TAB_ID: 'FRM-0000',
  UNRECOGNIZED_ACTION: 'FRM-0001',

  // i18n error codes
  NO_LANGUAGE_FOUND: 'I18N-0001',
  MISSING_TRANSLATION_KEY: 'I18N-0002',

  // instance error codes
  NO_FACTORY_PROVIDED: 'INST-0001',

  // route error codes
  ROUTE_NOT_FOUND: 'RTE-0001',

  // validation error codes
  INVALID_NUMBER: 'VAL-0001',
  INVALID_SIN_FORMAT: 'VAL-0002',

  // xstate error codes
  MISSING_META: 'XST-0001',

  // dev-only error codes
  TEST_ERROR_CODE: 'DEV-0001',

  // service error codes
  NO_OPTION_SET_FOUND: 'SVC-0001',
  NO_APPLICANT_HAD_SIN_OPTION_FOUND: 'SVC-0002',
  NO_APPLICANT_PRIMARY_DOCUMENT_CHOICE_FOUND: 'SVC-0003',
  NO_APPLICANT_SECONDARY_DOCUMENT_CHOICE_FOUND: 'SVC-0004',
  NO_APPLICATION_SUBMISSION_SCENARIO_FOUND: 'SVC-0005',
  NO_COUNTRY_FOUND: 'SVC-0006',
  NO_GENDER_FOUND: 'SVC-0007',
  NO_PROVINCE_FOUND: 'SVC-0008',
  NO_TYPE_OF_APPLICATION_TO_SUBMIT_FOUND: 'SVC-0009',
  NO_LANGUAGE_OF_CORRESPONDENCE_FOUND: 'SVC-0010',
  NO_APPLICANT_STATUS_IN_CANADA_CHOICE_FOUND: 'SVC-00011',
  NO_APPLICANT_SUPPORTING_DOCUMENT_TYPE_FOUND: 'SVC-00012',
  SUBMIT_SIN_APPLICATION_FAILED: 'SVC-0013',
  SIN_CASE_NOT_FOUND: 'SVC-0014',
  SEARCH_RESULTS_NOT_FOUND: 'SVC-0015',
  ASSOCIATE_SIN_REQUEST_FAILED: 'SVC-0016',

  // external api error codes
  XAPI_API_ERROR: 'XAPI-0001',
} as const;
