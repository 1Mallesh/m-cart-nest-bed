import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';
import { AuditQueryDto } from './dto/audit.dto';

export interface RecordAuditInput {
  actor?: string;
  action: string;
  entity: string;
  entityId?: string;
  meta?: Record<string, unknown>;
  ip?: string;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditModel: Model<AuditLogDocument>,
  ) {}

  record(input: RecordAuditInput): Promise<AuditLogDocument> {
    return this.auditModel.create({
      ...input,
      actor: input.actor ? new Types.ObjectId(input.actor) : undefined,
    });
  }

  async list(query: AuditQueryDto) {
    const { page, limit } = query;
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.auditModel
        .find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.auditModel.countDocuments().exec(),
    ]);
    return { items, total, page, limit };
  }
}
