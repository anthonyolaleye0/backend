import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export enum Role {
  admin = 'admin',
  user = 'user',
}

export enum BusinessType {
  SME = 'SME',
  Individual = 'Individual',
  Consultant = 'Consultant',
}

export enum TaxTypes {
  VAT = 'VAT',
  PAYE = 'PAYE',
  WHT = 'WHT',
  CIT = 'CIT',
  CGT = 'CGT',
}

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email!: string;

  @Prop({ required: true })
  password!: string;

  @Prop({ type: String, enum: Role, default: Role.user })
  role!: Role;

  @Prop({ type: String, enum: BusinessType, default: BusinessType.Individual })
  businessType!: BusinessType;

  @Prop({ type: Array, enum: TaxTypes })
  taxTypes!: TaxTypes[];

  @Prop({ required: true })
  firstName!: string;

  @Prop({ required: true })
  lastName!: string;

  @Prop({ required: true })
  whatsappPhoneNumber!: string;

  @Prop({ default: false })
  isVerified!: boolean;

  @Prop({ default: false })
  isWhatsAppVerified!: boolean;

  @Prop({ default: false })
  isSubscribedToTips!: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
