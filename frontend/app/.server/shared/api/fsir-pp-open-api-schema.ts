export interface paths {
  '/search': {
    post: {
      requestBody: {
        content: {
          'application/json': {
            caseGuid: string;
            idToken: string;
          };
        };
      };
      responses: {
        200: {
          content: {
            'application/json': {
              results: {
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
              }[];
            };
          };
        };
      };
    };
  };
  '/associate-sin': {
    post: {
      requestBody: {
        content: {
          'application/json': {
            caseGuid: string;
            idToken: string;
          };
        };
      };
      responses: {
        200: {
          content: {
            'application/json': {
              code: string;
              SIN: string;
            };
          };
        };
      };
    };
  };
}
