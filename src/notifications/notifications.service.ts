import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Notification,
  NotificationChannel,
  NotificationDocument,
} from './schemas/notification.schema';
import { PaginationDto } from './dto/notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  async send(
    userId: string,
    channel: NotificationChannel,
    title: string,
    body: string,
    meta?: Record<string, unknown>,
  ): Promise<NotificationDocument> {
    const notification = await this.notificationModel.create({
      user: new Types.ObjectId(userId),
      channel,
      title,
      body,
      meta,
    });
    // TODO: real dispatch via FCM (push), Twilio/MSG91 (sms/whatsapp), or SES (email).
    return notification;
  }

  async list(userId: string, pagination: PaginationDto) {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.notificationModel
        .find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.notificationModel.countDocuments({ user: userId }).exec(),
    ]);
    return { items, total, page, limit };
  }

  async markRead(userId: string, id: string): Promise<NotificationDocument> {
    const notification = await this.notificationModel
      .findOneAndUpdate(
        { _id: id, user: userId },
        { read: true },
        { new: true },
      )
      .exec();
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    return notification;
  }

  async markAllRead(userId: string): Promise<{ updated: number }> {
    const res = await this.notificationModel
      .updateMany({ user: userId, read: false }, { read: true })
      .exec();
    return { updated: res.modifiedCount };
  }
}
