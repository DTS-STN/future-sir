import { describe, expect, it } from 'vitest';

import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';
import type { I18nRouteFile } from '~/i18n-routes';
import { i18nRoutes, isI18nLayoutRoute, isI18nPageRoute } from '~/i18n-routes';
import { findRouteByFile, findRouteByPath, getRouteByFile, getRouteByPath } from '~/utils/route-utils';

describe('route-utils', () => {
  describe('findRouteByFile', () => {
    it('should return the correct route for a given file', () => {
      expect(findRouteByFile('routes/public/index.tsx', i18nRoutes)).toEqual({
        id: 'PUBL-0001',
        file: 'routes/public/index.tsx',
        paths: { en: '/en/public', fr: '/fr/public' },
      });
    });

    it('should return undefined if the route is not found', () => {
      expect(findRouteByFile('routes/💩.tsx', i18nRoutes)).toBeUndefined();
    });
  });

  describe('findRouteByPath', () => {
    it('should return the correct route for a given path', () => {
      expect(findRouteByPath('/en/public', i18nRoutes)).toEqual({
        id: 'PUBL-0001',
        file: 'routes/public/index.tsx',
        paths: { en: '/en/public', fr: '/fr/public' },
      });
    });

    it('should return undefined if the route is not found', () => {
      expect(findRouteByPath('/en/foobar', i18nRoutes)).toBeUndefined();
    });
  });

  describe('getRouteByFile', () => {
    it('should return the correct route for a given file', () => {
      expect(getRouteByFile('routes/public/index.tsx', i18nRoutes)).toEqual({
        id: 'PUBL-0001',
        file: 'routes/public/index.tsx',
        paths: { en: '/en/public', fr: '/fr/public' },
      });
    });

    it('should throw an error if the route is not found', () => {
      try {
        getRouteByFile('routes/💩.tsx' as I18nRouteFile, i18nRoutes);
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);

        const appError = error as AppError;
        expect(appError.msg).toEqual('No route found for routes/💩.tsx (this should never happen)');
        expect(appError.errorCode).toEqual(ErrorCodes.ROUTE_NOT_FOUND);
      }
    });
  });

  describe('getRouteByPath', () => {
    it('should return the correct route for a given path', () => {
      expect(getRouteByPath('/en/public', i18nRoutes)).toEqual({
        id: 'PUBL-0001',
        file: 'routes/public/index.tsx',
        paths: { en: '/en/public', fr: '/fr/public' },
      });
    });

    it('should throw an error if the route is not found', () => {
      try {
        getRouteByPath('/en/foobar', i18nRoutes);
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);

        const appError = error as AppError;
        expect(appError.msg).toEqual('No route found for /en/foobar (this should never happen)');
        expect(appError.errorCode).toEqual(ErrorCodes.ROUTE_NOT_FOUND);
      }
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
