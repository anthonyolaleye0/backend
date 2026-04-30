// Calculator.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CalculatorDocument = HydratedDocument<Calculator>;

@Schema()
export class Calculator {
  @Prop({ required: true })
  name!: string; // stores the name of the tax that the formular is for e.g Income tax calculator

  @Prop({ required: true })
  formula!: string; // stores the code to calculate the Income tax name above
}

export const CalculatorSchema = SchemaFactory.createForClass(Calculator);
