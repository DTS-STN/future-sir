export type ApplicantGender = Readonly<{
  id: string;
  nameEn: string;
  nameFr: string;
}>;

export type LocalizedApplicantGender = Readonly<{
  id: string;
  name: string;
}>;

export type ApplicantPrimaryDocumentChoice = Readonly<{
  id: string;
  nameEn: string;
  nameFr: string;
  applicantStatusInCanadaId: string;
}>;

export type LocalizedApplicantPrimaryDocumentChoice = Readonly<{
  id: string;
  name: string;
  applicantStatusInCanadaId: string;
}>;

export type ApplicantSecondaryDocumentChoice = Readonly<{
  id: string;
  nameEn: string;
  nameFr: string;
}>;

export type LocalizedApplicantSecondaryDocumentChoice = Readonly<{
  id: string;
  name: string;
}>;

export type ApplicantHadSinOption = Readonly<{
  id: string;
  nameEn: string;
  nameFr: string;
}>;

export type LocalizedApplicantHadSinOption = Readonly<{
  id: string;
  name: string;
}>;

export type ApplicationSubmissionScenario = Readonly<{
  id: string;
  nameEn: string;
  nameFr: string;
}>;

export type LocalizedApplicationSubmissionScenario = Readonly<{
  id: string;
  name: string;
}>;

export type TypeOfApplicationToSubmit = Readonly<{
  id: string;
  nameEn: string;
  nameFr: string;
}>;

export type LocalizedTypeOfApplicationToSubmit = Readonly<{
  id: string;
  name: string;
}>;

export type LanguageOfCorrespondence = Readonly<{
  id: string;
  nameEn: string;
  nameFr: string;
}>;

export type LocalizedPreferredLanguage = Readonly<{
  id: string;
  name: string;
}>;

export type ApplicantStatusInCanadaChoice = Readonly<{
  id: string;
  nameEn: string;
  nameFr: string;
}>;

export type LocalizedApplicantStatusInCanadaChoice = Readonly<{
  id: string;
  name: string;
}>;

export type ApplicantSupportingDocumentType = Readonly<{
  id: string;
  nameEn: string;
  nameFr: string;
}>;

export type LocalizedApplicantSupportingDocumentType = Readonly<{
  id: string;
  name: string;
}>;
