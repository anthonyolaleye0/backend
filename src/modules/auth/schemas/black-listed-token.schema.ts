import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BlacklistedTokenDocument = HydratedDocument<BlacklistedToken>;

@Schema({ timestamps: true })
export class BlacklistedToken {
  @Prop({ required: true })
  token!: string;

  @Prop({ required: true })
  expiresAt!: Date;
}

export const BlacklistedTokenSchema =
  SchemaFactory.createForClass(BlacklistedToken);
BlacklistedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
