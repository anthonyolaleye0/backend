import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    // console.log('AUTH HEADER:', req.headers.authorization);
    // console.log('I am running JWT AUTH GUARD');
    // console.log('JwtAuthGuard context:', context);

    const result = (await super.canActivate(context)) as boolean;

    // console.log('JWTAuthGuard result:', result);
    return result;
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      if (info?.name === 'TokenExpiredError') {
        throw new UnauthorizedException({
          message: 'Token has expired.',
          success: false,
          status: 401,
          error: 'TOKEN_EXPIRED',
        });
      }

      if (info?.name === 'JsonWebTokenError') {
        throw new UnauthorizedException({
          message: 'Invalid token',
          success: false,
          status: 401,
          error: 'INVALID_TOKEN',
        });
      }

      if (info?.name === 'NotBeforeError') {
        throw new UnauthorizedException({
          message: 'Token not active yet.',
          success: false,
          status: 401,
          error: 'TOKEN_NOT_ACTIVE',
        });
      }
      throw new UnauthorizedException({
        message: 'Unauthorized',
        status: 401,
        success: false,
        error: 'AUTH_FAILED',
      });
    }

    return user;
  }
}
