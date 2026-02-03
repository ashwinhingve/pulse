import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClearanceLevel } from '../../common/enums/roles.enum';
import { CLEARANCE_KEY } from '../decorators/clearance.decorator';

@Injectable()
export class ClearanceGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredClearance = this.reflector.getAllAndOverride<ClearanceLevel>(CLEARANCE_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (requiredClearance === undefined) {
            return true;
        }

        const { user } = context.switchToHttp().getRequest();

        return user.clearance >= requiredClearance;
    }
}
