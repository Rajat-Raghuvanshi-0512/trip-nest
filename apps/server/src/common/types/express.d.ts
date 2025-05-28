import { RequestUser } from '../decorators/user.decorator';

declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
    }
  }
}

export {};
