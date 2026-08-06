import { IsMongoId, IsNumber, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class CreatePaymentIntentDto {
  @IsNumber()
  amount!: number;

  @IsString()
  email!: string;

  @IsMongoId()
  planId!: Types.ObjectId;

  @IsMongoId()
  userId!: Types.ObjectId;
}
