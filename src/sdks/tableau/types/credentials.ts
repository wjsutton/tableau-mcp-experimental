import { z } from 'zod';

export const credentialsSchema = z.object({
  credentials: z.object({
    site: z.object({
      id: z.string(),
    }),
    user: z.object({
      id: z.string(),
    }),
    token: z.string(),
  }),
});

export type Credentials = z.infer<typeof credentialsSchema>['credentials'];
