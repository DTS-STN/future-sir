import type { Route } from '.react-router/types/app/routes/protected/person-case/+types/request-details';

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data.documentTitle }];
}
