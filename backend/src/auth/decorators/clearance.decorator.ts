import { SetMetadata } from '@nestjs/common';
import { ClearanceLevel } from '../../common/enums/roles.enum';

export const CLEARANCE_KEY = 'clearance';
export const Clearance = (level: ClearanceLevel) => SetMetadata(CLEARANCE_KEY, level);
