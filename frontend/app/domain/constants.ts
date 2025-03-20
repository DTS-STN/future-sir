// Mapping of applicant statuses in Canada from an external data source.
export const APPLICANT_STATUS_IN_CANADA = {
  canadianCitizenBornOutsideCanada: '900000001',
  registeredIndianBornInCanada: '900000002',
} as const;

// Mapping of applicant primary document types from an external data source.
export const APPLICANT_PRIMARY_DOCUMENT_CHOICE = {
  certificateOfCanadianCitizenship: '9800000014',
  certificatesOfRegistrationOfBirthAbroad: '9800000015',
  birthCertificatesAndCertificatesOfIndianStatus: '9800000016',
  certificatesOfCanadianCitizenshipAndCertificatesOfIndianStatus: '9800000017',
} as const;
