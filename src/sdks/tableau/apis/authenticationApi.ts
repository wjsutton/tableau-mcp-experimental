import {
  makeApi,
  makeEndpoint,
  Zodios,
  ZodiosEndpointDefinitions,
  ZodiosInstance,
} from '@zodios/core';
import { z } from 'zod';

import { credentialsSchema } from '../types/credentials.js';

const signInRequestSchema = z.object({
  credentials: z
    .object({
      site: z.object({
        contentUrl: z.string(),
      }),
    })
    .and(
      z
        .object({
          name: z.string(),
          password: z.string(),
        })
        .or(
          z.object({
            personalAccessTokenName: z.string(),
            personalAccessTokenSecret: z.string(),
          }),
        )
        .or(
          z.object({
            jwt: z.string(),
          }),
        ),
    ),
});

const signInEndpoint = makeEndpoint({
  method: 'post',
  path: '/auth/signin',
  alias: 'signIn',
  description: 'Signs in with a username and password.',
  response: credentialsSchema,
  parameters: [
    {
      name: 'credentials',
      type: 'Body',
      schema: signInRequestSchema,
    },
  ],
});

const authenticationApi = makeApi([signInEndpoint]);
const authenticationApis = [...authenticationApi] as const satisfies ZodiosEndpointDefinitions;

export type AuthenticationApiClient = ZodiosInstance<typeof authenticationApis>;
export const getApiClient = (baseUrl: string): AuthenticationApiClient =>
  new Zodios(baseUrl, authenticationApis);
