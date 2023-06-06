import { users } from '@prisma/client';
declare global {
  namespace Express {
    export interface User extends users {}
  }
}
