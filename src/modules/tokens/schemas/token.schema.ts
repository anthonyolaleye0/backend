import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum TokenPurpose {
  email_verification = 'email_verification',
  password_reset = 'password_reset',
}

export type TokenDocument = HydratedDocument<Token>;

@Schema({ timestamps: true })
export class Token {
  @Prop({ required: true, enum: TokenPurpose })
  purpose!: TokenPurpose;

  @Prop({ required: true })
  token!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user!: Types.ObjectId;

  @Prop({ required: true, expires: 0 })
  expiresAt!: Date;
}

export const TokenSchema = SchemaFactory.createForClass(Token);
