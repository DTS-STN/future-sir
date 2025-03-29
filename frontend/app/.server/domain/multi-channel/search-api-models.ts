export type SearchRequest = {
  caseGuid: string;
  idToken: string;
};

export type SearchResponse = {
  results?: HitListResult[];
};

export type HitListResult = {
  id: string;
  firstName: string;
  middleName: string | undefined;
  lastName: string;
  yearOfBirth: number;
  monthOfBirth: number;
  dateOfBirth: number;
  parentSurname: string;
  partialSIN: string;
  score: number;
};
