import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  FeatureFlag,
  FeatureFlagDocument,
} from './schemas/feature-flag.schema';
import { UpsertFeatureFlagDto } from './dto/feature-flag.dto';

@Injectable()
export class FeatureFlagsService {
  constructor(
    @InjectModel(FeatureFlag.name)
    private readonly model: Model<FeatureFlagDocument>,
  ) {}

  list(): Promise<FeatureFlagDocument[]> {
    return this.model.find().exec();
  }

  upsert(dto: UpsertFeatureFlagDto): Promise<FeatureFlagDocument> {
    return this.model
      .findOneAndUpdate({ key: dto.key }, dto, {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      })
      .exec();
  }

  async isEnabled(key: string): Promise<boolean> {
    const flag = await this.model.findOne({ key }).lean().exec();
    return Boolean(flag?.enabled);
  }
}
