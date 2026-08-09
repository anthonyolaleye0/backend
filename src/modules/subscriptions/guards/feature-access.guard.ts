import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../users/schemas/user.schema';
import { REQUIRE_FEATURE_KEY } from '../decorators/require-feature.decorator';
import { FeatureKey } from '../enums/feature.enum';
import { SubscriptionsService } from '../subscriptions.service';

@Injectable()
export class FeatureAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeature = this.reflector.getAllAndOverride<FeatureKey>(
      REQUIRE_FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredFeature) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    console.log('feature access userID:', user);

    if (!user.sub || !user.role) {
      throw new ForbiddenException({
        message: 'User authentication required.',
        success: false,
        status: 403,
      });
    }

    if (user.role !== Role.admin) {
      const hasAccess = await this.subscriptionsService.userHasFeature(
        user.sub.toString(),
        requiredFeature,
      );

      if (!hasAccess) {
        throw new ForbiddenException({
          message: `Your subscription tier does not allow access to the '${requiredFeature}' feature. Please upgrade your plan.`,
          success: false,
          status: 403,
        });
      }
    }

    return true;
  }
}
