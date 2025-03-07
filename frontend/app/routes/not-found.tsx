/**
 * This file defines a React Router v7 route for handling 404 pages.
 *
 * It includes a loader function that throws a 404 response and
 * a route component that intentionally renders an empty fragment.
 */
import type { Route } from './+types/not-found';

/**
 * This loader functoin throws a 404 response to indicate that the requested resource was not found.
 * Actual rendering of the 404 page content should be handled in a global error boundary.
 */
export function loader(args: Route.LoaderArgs) {
  throw new Response('Not found', { status: 404 });
}

/**
 * This route component returns an empty fragment to prevent
 * React Router from treating this route as a resource route.
 *
 * Without this component, React Router treats the loader function
 * as an API and renders application/json content instead of HTML.
 */
export default function NotFound(props: Route.ComponentProps) {
  return <></>;
}
