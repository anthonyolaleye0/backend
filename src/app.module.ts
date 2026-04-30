import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import Joi from 'joi';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config/configuration';
import { MailModule } from './mail/mail.module';
import { AmendmentsModule } from './modules/amendments/amendments.module';
import { AuthModule } from './modules/auth/auth.module';
import { CalculatorsModule } from './modules/calculators/calculators.module';
import { CaseLawModule } from './modules/case-law/case-law.module';
import { DeadlinesModule } from './modules/deadlines/deadlines.module';
import { DocumentProcessingModule } from './modules/document-processing/document-processing.module';
import { FinanceModule } from './modules/finance/finance.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { RefreshTokensModule } from './modules/refresh-tokens/refresh-tokens.module';
import { SearchModule } from './modules/search/search.module';
import { TaxLawsModule } from './modules/tax-laws/tax-laws.module';
import { TaxTipsModule } from './modules/tax-tips/tax-tips.module';
import { TokensModule } from './modules/tokens/tokens.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: Joi.object({
        JWT_SECRET: Joi.string().required(),
        JWT_REFRESH_SECRET: Joi.string().required(),
        JWT_EXPIRES_IN: Joi.string().required(),
        MONGO_URI: Joi.string().required(),
      }),
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const uri = configService.get<string>('MONGO_URI');
        // const uri = process.env.MONGO_URI;

        return {
          uri,
          connectionFactory: (connection) => {
            console.log('Connecting to database...');
            if (connection.readyState === 1) {
              console.log(`MongoDB connected to database: ${connection.name}`);
            }

            connection.on('reconnected', () => {
              console.log('🔄 MongoDB reconnected...');
            });

            connection.on('error', (error) => {
              console.error('MongoDB connection error:', error);
            });

            connection.on('disconnected', () => {
              console.warn('MongoDB disconnected');
            });

            return connection;
          },
          serverSelectionTimeoutMS: 5000,
        };
      },
    }),

    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');

        if (redisUrl) {
          const redisArray = redisUrl.split(':');

          const url = new URL(redisUrl);
          return {
            redis: {
              host: url.hostname,
              port: Number(url.port),
              maxRetriesPerRequest: null,
            },
          };
        }

        return {
          redis: {
            host: '127.0.0.1',
            port: 6379,
          },
        };
      },
    }),
    MailModule,
    AuthModule,
    TokensModule,
    UsersModule,
    RefreshTokensModule,
    TaxLawsModule,
    AmendmentsModule,
    CaseLawModule,
    DeadlinesModule,
    TaxTipsModule,
    NotificationsModule,
    CalculatorsModule,
    FinanceModule,
    SearchModule,
    DocumentProcessingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
