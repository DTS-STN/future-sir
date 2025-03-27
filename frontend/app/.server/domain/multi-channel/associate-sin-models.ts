export type AssociateSinRequest = {
  caseGuid: string;
  idToken: string;
};

export type AssociateSinResponse = {
  code: string;
  SIN: string;
};
