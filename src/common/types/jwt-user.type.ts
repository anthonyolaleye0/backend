import { Types } from 'mongoose';
import { Role } from '../../modules/users/schemas/user.schema';

export interface JwtUser {
  sub: Types.ObjectId;
  email: string;
  role: Role;
}
