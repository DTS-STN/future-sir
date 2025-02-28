export type ApplicantGender = Readonly<{
  id: string;
  nameEn: string | null;
  nameFr: string | null;
}>;

export type LocalizedApplicantGender = Readonly<{
  id: string;
  name: string | null;
}>;

export type ApplicantPrimaryDocumentChoice = Readonly<{
  id: string;
  nameEn: string | null;
  nameFr: string | null;
}>;

export type LocalizedApplicantPrimaryDocumentChoice = Readonly<{
  id: string;
  name: string | null;
}>;

export type ApplicantSecondaryDocumentChoice = Readonly<{
  id: string;
  nameEn: string | null;
  nameFr: string | null;
}>;

export type LocalizedApplicantSecondaryDocumentChoice = Readonly<{
  id: string;
  name: string | null;
}>;

export type ApplicantHadSinOption = Readonly<{
  id: string;
  nameEn: string | null;
  nameFr: string | null;
}>;

export type LocalizedApplicantHadSinOption = Readonly<{
  id: string;
  name: string | null;
}>;

export type ApplicationSubmissionScenario = Readonly<{
  id: string;
  nameEn: string | null;
  nameFr: string | null;
}>;

export type LocalizedApplicationSubmissionScenario = Readonly<{
  id: string;
  name: string | null;
}>;

export type TypeOfApplicationToSubmit = Readonly<{
  id: string;
  nameEn: string | null;
  nameFr: string | null;
}>;

export type LocalizedTypeOfApplicationToSubmit = Readonly<{
  id: string;
  name: string | null;
}>;

export type LanguageOfCorrespondence = Readonly<{
  id: string;
  nameEn: string | null;
  nameFr: string | null;
}>;

export type LocalizedPreferredLanguage = Readonly<{
  id: string;
  name: string | null;
}>;
