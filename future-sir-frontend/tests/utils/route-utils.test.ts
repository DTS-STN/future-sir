import { describe, expect, it } from 'vitest';

import type { I18nRouteFile } from '~/i18n-routes';
import { i18nRoutes } from '~/i18n-routes';
import { findRouteByFile, getRouteByFile, isI18nLayoutRoute, isI18nPageRoute } from '~/utils';

describe('route-utils', () => {
  describe('findRouteByFile', () => {
    it('should return the correct route for a given file', () => {
      expect(findRouteByFile('routes/public/_index.tsx', i18nRoutes)).toEqual({
        file: 'routes/public/_index.tsx',
        paths: {
          en: '/en/public',
          fr: '/fr/public',
        },
      });
    });

    it('should return undefined if the route is not found', () => {
      expect(findRouteByFile('routes/💩.tsx', i18nRoutes)).toBeUndefined();
    });
  });

  describe('getRouteByFile', () => {
    it('should return the correct route for a given file', () => {
      expect(getRouteByFile('routes/public/_index.tsx', i18nRoutes)).toEqual({
        file: 'routes/public/_index.tsx',
        paths: {
          en: '/en/public',
          fr: '/fr/public',
        },
      });
    });

    it('should throw an error if the route is not found', () => {
      expect(() => getRouteByFile('routes/💩.tsx' as I18nRouteFile, i18nRoutes)).toThrowError(
        'No route found for routes/💩.tsx (this should never happen)',
      );
    });
  });

  describe('isI18nLayoutRoute', () => {
    it('should correctly identify I18nLayoutRoute objects', () => {
      expect(isI18nLayoutRoute({})).toEqual(false);
      expect(isI18nLayoutRoute([])).toEqual(false);
      expect(isI18nLayoutRoute(null)).toEqual(false);
      expect(isI18nLayoutRoute(undefined)).toEqual(false);
      expect(isI18nLayoutRoute({ file: 'routes/layout.tsx', children: [] })).toEqual(true);
    });
  });

  describe('isI18nPageRoute', () => {
    it('should correctly identify I18nPageRoute objects', () => {
      expect(isI18nPageRoute({})).toEqual(false);
      expect(isI18nPageRoute([])).toEqual(false);
      expect(isI18nPageRoute(null)).toEqual(false);
      expect(isI18nPageRoute(undefined)).toEqual(false);
      expect(isI18nPageRoute({ file: 'routes/index.tsx', paths: { en: '/en', fr: '/fr' } })).toEqual(true);
    });
  });
});
