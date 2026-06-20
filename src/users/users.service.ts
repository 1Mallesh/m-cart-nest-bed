import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { ListUsersQueryDto, UpdateProfileDto } from './dto/user.dto';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  create(data: Partial<User>): Promise<UserDocument> {
    return this.userModel.create(data);
  }

  findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  // --- user management ---

  /** Fetch a user or throw 404. Secrets are excluded by schema `select:false`. */
  async getOrThrow(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  /** Self-service profile update (name / email / phone) with uniqueness checks. */
  async updateProfile(
    id: string,
    dto: UpdateProfileDto,
  ): Promise<UserDocument> {
    const user = await this.getOrThrow(id);

    if (dto.email && dto.email.toLowerCase() !== user.email) {
      const email = dto.email.toLowerCase();
      const exists = await this.userModel.exists({
        email,
        _id: { $ne: id },
      });
      if (exists) {
        throw new ConflictException('Email already in use');
      }
      user.email = email;
      user.emailVerified = false;
    }
    if (dto.phone && dto.phone !== user.phone) {
      const exists = await this.userModel.exists({
        phone: dto.phone,
        _id: { $ne: id },
      });
      if (exists) {
        throw new ConflictException('Phone already in use');
      }
      user.phone = dto.phone;
      user.phoneVerified = false;
    }
    if (dto.name !== undefined) {
      user.name = dto.name;
    }
    await user.save();
    return user;
  }

  /** Admin: paginated, filterable user list. */
  async list(query: ListUsersQueryDto): Promise<{
    data: UserDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const filter: FilterQuery<UserDocument> = {};

    if (query.role) {
      filter.roles = query.role;
    }
    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }
    if (query.search) {
      const rx = new RegExp(query.search, 'i');
      filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
    }

    const [data, total] = await Promise.all([
      this.userModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);
    return { data, total, page, limit };
  }

  /** Admin: activate / deactivate a user. */
  async setActive(id: string, isActive: boolean): Promise<UserDocument> {
    const user = await this.getOrThrow(id);
    user.isActive = isActive;
    await user.save();
    return user;
  }

  /** Admin: replace a user's roles. */
  async setRoles(id: string, roles: Role[]): Promise<UserDocument> {
    if (!roles.length) {
      throw new BadRequestException('At least one role is required');
    }
    const user = await this.getOrThrow(id);
    user.roles = roles;
    await user.save();
    return user;
  }

  findByEmail(
    email: string,
    withSecrets = false,
  ): Promise<UserDocument | null> {
    const query = this.userModel.findOne({ email: email.toLowerCase() });
    if (withSecrets) {
      query.select('+passwordHash +refreshTokenHash');
    }
    return query.exec();
  }

  findByPhone(phone: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ phone }).exec();
  }

  findByGoogleId(googleId: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ googleId }).exec();
  }

  findByIdWithRefresh(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).select('+refreshTokenHash').exec();
  }

  async setRefreshTokenHash(id: string, hash: string | null): Promise<void> {
    await this.userModel
      .updateOne({ _id: id }, { refreshTokenHash: hash })
      .exec();
  }
}
