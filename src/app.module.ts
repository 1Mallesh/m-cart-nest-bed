import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import * as Joi from 'joi';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
// Infra (global)
import { KafkaModule } from './kafka/kafka.module';
import { RedisModule } from './redis/redis.module';
// Catalog
import { CategoriesModule } from './categories/categories.module';
import { BrandsModule } from './brands/brands.module';
import { ProductsModule } from './products/products.module';
import { InventoryModule } from './inventory/inventory.module';
// Commerce
import { CartModule } from './cart/cart.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { CouponsModule } from './coupons/coupons.module';
import { AddressesModule } from './addresses/addresses.module';
import { ReviewsModule } from './reviews/reviews.module';
// Orders / payments / wallet
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { WalletModule } from './wallet/wallet.module';
// Logistics / platform
import { VendorsModule } from './vendors/vendors.module';
import { DeliveryModule } from './delivery/delivery.module';
import { TrackingModule } from './tracking/tracking.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuditModule } from './audit/audit.module';
import { BookingsModule } from './bookings/bookings.module';
import { FeatureFlagsModule } from './feature-flags/feature-flags.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'test', 'production')
          .default('development'),
        PORT: Joi.number().default(3000),
        API_PREFIX: Joi.string().default('api'),
        API_VERSION: Joi.string().default('1'),
        MONGO_URI: Joi.string().required(),
        // Secrets must be provided and strong; never fall back to a default.
        JWT_ACCESS_SECRET: Joi.string()
          .min(16)
          .required()
          .invalid('change_me_access_secret'),
        JWT_REFRESH_SECRET: Joi.string()
          .min(16)
          .required()
          .invalid('change_me_refresh_secret'),
        JWT_ACCESS_TTL: Joi.string().default('900s'),
        JWT_REFRESH_TTL: Joi.string().default('7d'),
        // Optional infra — when present they switch from fallback to real.
        REDIS_URL: Joi.string().uri().allow('').optional(),
        KAFKA_BROKERS: Joi.string().allow('').optional(),
        KAFKA_CLIENT_ID: Joi.string().allow('').optional(),
        CORS_ORIGINS: Joi.string().allow('').optional(),
        OTP_TTL_SECONDS: Joi.number().optional(),
        // Payments / OTP / OAuth (optional in dev).
        RAZORPAY_KEY_ID: Joi.string().allow('').optional(),
        RAZORPAY_KEY_SECRET: Joi.string().allow('').optional(),
        MSG91_AUTH_KEY: Joi.string().allow('').optional(),
        GOOGLE_CLIENT_ID: Joi.string().allow('').optional(),
      }).unknown(true),
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>(
          'MONGO_URI',
          'mongodb://localhost:27017/M-Cart',
        ),
        maxPoolSize: 20,
        minPoolSize: 2,
        serverSelectionTimeoutMS: 5000,
        retryWrites: true,
      }),
    }),
    KafkaModule,
    RedisModule,
    UsersModule,
    AuthModule,
    CategoriesModule,
    BrandsModule,
    ProductsModule,
    InventoryModule,
    CartModule,
    WishlistModule,
    CouponsModule,
    AddressesModule,
    ReviewsModule,
    OrdersModule,
    PaymentsModule,
    WalletModule,
    VendorsModule,
    DeliveryModule,
    TrackingModule,
    NotificationsModule,
    AuditModule,
    BookingsModule,
    FeatureFlagsModule,
    HealthModule,
  ],
  providers: [
    // Enforce rate limiting globally (60 req / 60s per IP by default).
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
