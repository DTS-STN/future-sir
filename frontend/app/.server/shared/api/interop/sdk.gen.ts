// This file is auto-generated by @hey-api/openapi-ts

import type { Options as ClientOptions, TDataShape, Client } from '@hey-api/client-fetch';
import type { SinapplicationData, SinapplicationResponse } from './types.gen';
import { client as _heyApiClient } from './client.gen';

export type Options<TData extends TDataShape = TDataShape, ThrowOnError extends boolean = boolean> = ClientOptions<TData, ThrowOnError> & {
    /**
     * You can provide a client instance returned by `createClient()` instead of
     * individual options. This might be also useful if you want to implement a
     * custom client.
     */
    client?: Client;
    /**
     * You can pass arbitrary values through the `meta` object. This can be
     * used to access values that aren't defined as part of the SDK function.
     */
    meta?: Record<string, unknown>;
};

export const sinapplication = <ThrowOnError extends boolean = false>(options: Options<SinapplicationData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).post<SinapplicationResponse, string | object, ThrowOnError>({
        url: '/SINApplication',
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    });
};