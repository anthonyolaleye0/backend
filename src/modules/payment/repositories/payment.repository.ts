import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { QueryWithPaginationDto } from '../../../common/dto/query-with-pagination';
import { generatePaymentReference } from '../../../common/utils/helper';
import { CreatePaymentIntentDto } from '../dtos/payment-intent.dto';
import { PaymentProvider } from '../enums/payment-provider.enum';
import { PaymentStatus } from '../enums/payment-status.enum';
import { Payment, PaymentDocument } from '../schemas/payment.schema';

@Injectable()
export class PaymentRepository {
  constructor(
    @InjectModel(Payment.name)
    private paymentModel: Model<PaymentDocument>,
  ) {}

  async getPaymentDocByReference(
    reference: string,
  ): Promise<PaymentDocument | null> {
    const response = await this.paymentModel.findOne({
      providerReference: reference,
    });

    return response;
  }

  async getPaymentDocNotExpiredByUserIdPlanId(
    userId: Types.ObjectId,
    planId: Types.ObjectId,
  ): Promise<PaymentDocument | null> {
    const response = await this.paymentModel
      .findOne({
        userId,
        planId,
        status: PaymentStatus.pending,
        isDeleted: false,
        expiresAt: { $gt: new Date() },
      })
      .sort({ createdAt: -1 });

    return response;
  }

  async deleteIncompletePendingPayments(
    userId: Types.ObjectId,
    planId: Types.ObjectId,
  ) {
    return this.paymentModel.deleteMany({
      userId,
      planId,
      status: PaymentStatus.pending,
      isDeleted: false,
      $or: [
        { providerReference: { $exists: false } },
        { providerReference: null },
        { providerReference: '' },
        { authorizationUrl: { $exists: false } },
        { authorizationUrl: null },
        { authorizationUrl: '' },
      ],
    });
  }

  async createPaymentIntent(
    provider: PaymentProvider,
    dto: CreatePaymentIntentDto,
  ) {
    const payload = {
      planId: dto.planId,
      userId: dto.userId,
    };
    const reference = generatePaymentReference(payload, 'PAYMENT');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    const data = {
      amount: dto.amount,
      email: dto.email,
      planId: dto.planId,
      reference,
      provider,
      expiresAt,
      userId: dto.userId,
    };
    const newPayment = await new this.paymentModel(data).save();

    return newPayment;
  }

  async updateIntentWithAuthUrl(
    id: Types.ObjectId,
    authorizationUrl: string,
    providerReference: string,
  ): Promise<PaymentDocument | null> {
    console.log('providerReference:', providerReference);
    const update = await this.paymentModel.findByIdAndUpdate(
      id,
      {
        authorizationUrl: authorizationUrl,
        providerReference: providerReference,
      },
      { returnDocument: 'after' },
    );

    return update;
  }

  async getPaymentById(paymentId: string): Promise<PaymentDocument | null> {
    const id = new Types.ObjectId(paymentId);

    const response = await this.paymentModel.findById(id);

    return response;
  }

  async getAllPayments(
    queryWithPaginationDto: QueryWithPaginationDto,
  ): Promise<{
    payments: PaymentDocument[];
    totalPages: number;
    totalCount: number;
  }> {
    const { page, limit, searchParams } = queryWithPaginationDto;

    let query = this.paymentModel.find();

    if (searchParams) {
      const regex = new RegExp(searchParams, 'i');

      query = query.where({
        $or: [{ email: { $regex: regex } }],
      });
    }

    const count = await query.clone().countDocuments();
    let pages = 0;

    if (pages !== undefined && limit !== undefined && count !== 0) {
      const offset = (page - 1) * limit;

      query = query.skip(offset).limit(limit);
      pages = Math.ceil(count / limit);

      if (page > pages) {
        throw new NotFoundException({
          message: 'Page not found.',
          success: false,
          status: 404,
        });
      }
    }

    const payments = await query.sort({ createdAt: -1 });

    if (!payments) {
      throw new NotFoundException({
        message: 'Payments not found.',
        success: false,
        status: 404,
      });
    }

    const response = {
      payments,
      totalPages: pages,
      totalCount: count,
    };

    return response;
  }

  async getAllMyPayments(
    userId: string,
    queryWithPaginationDto: QueryWithPaginationDto,
  ): Promise<{
    payments: PaymentDocument[];
    totalCount: number;
    totalPages: number;
  }> {
    const { page, limit, searchParams } = queryWithPaginationDto;

    const id = new Types.ObjectId(userId);

    let query = this.paymentModel.find({ user: id, isDeleted: false });

    if (searchParams) {
      const regex = new RegExp(searchParams, 'i');
      query = query.where({
        $or: [{ email: { $regex: regex } }],
      });
    }

    const count = await query.clone().countDocuments();
    let pages = 0;

    if (pages !== undefined && limit !== undefined && count !== 0) {
      const offset = (page - 1) * limit;

      query = query.skip(offset).limit(limit);
      pages = Math.ceil(count / limit);

      if (page > pages) {
        throw new NotFoundException({
          message: 'Page not found.',
          success: false,
          status: 404,
        });
      }
    }

    const payments = await query.sort({ createdAt: -1 });

    if (!payments) {
      throw new NotFoundException({
        message: 'Payments not found.',
        success: false,
        status: 404,
      });
    }

    const response = {
      payments,
      totalPages: pages,
      totalCount: count,
    };

    return response;
  }
}
