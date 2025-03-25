import { faker } from '@faker-js/faker';

import type { HitListResult } from '~/.server/domain/multi-channel/search-api-models';

function generateFakeHitListResult(seed: number): HitListResult {
  faker.seed(seed);
  return {
    id: faker.string.uuid(),
    firstName: faker.person.firstName(),
    middleName: faker.helpers.maybe(() => faker.person.firstName(), { probability: 0.3 }),
    lastName: faker.person.lastName(),
    yearOfBirth: faker.date.past({ years: 100 }).getFullYear(),
    monthOfBirth: faker.number.int({ min: 1, max: 12 }),
    dayOfBirth: faker.number.int({ min: 1, max: 28 }),
    parentSurname: faker.person.lastName(),
    partialSIN: faker.string.numeric(3),
    score: faker.number.int({ min: 0, max: 100 }),
  };
}

export function generateFakeHitListResults(count: number, seed: number): HitListResult[] {
  return Array.from({ length: count }, (_, index) => generateFakeHitListResult(seed + index)).sort((a, b) => b.score - a.score);
}
