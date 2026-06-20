import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DeliveryController } from './delivery.controller';
import { DeliveryService } from './delivery.service';
import {
  DeliveryProfile,
  DeliveryProfileSchema,
} from './schemas/delivery-profile.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DeliveryProfile.name, schema: DeliveryProfileSchema },
    ]),
  ],
  controllers: [DeliveryController],
  providers: [DeliveryService],
  exports: [DeliveryService],
})
export class DeliveryModule {}
