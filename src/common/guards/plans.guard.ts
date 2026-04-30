import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class PlansGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    console.log('I want to run PlansGuard');
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const plan =
      request.params?.plan || request.body?.plan || request.query?.plan;

    if (!user) {
      throw new ForbiddenException({
        message: 'User not found',
        success: false,
        status: 403,
      });
    }

    if (!plan) {
      throw new ForbiddenException({
        message: 'Plan not found',
        success: false,
        status: 403,
      });
    }

    const plans = ['SECONDARY', 'TERTIARY', 'OTHERS'];

    const hasPlan = user.plans.some((p) => p === plan);
    // const hasPlan = plans.some((p) => p === plan);

    if (!hasPlan) {
      throw new ForbiddenException({
        message: 'You do not have access to this plan',
        success: false,
        status: 403,
      });
    }

    return true;
  }
}
