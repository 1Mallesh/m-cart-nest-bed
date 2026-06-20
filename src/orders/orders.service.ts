import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument, OrderStatus } from './schemas/order.schema';
import { CreateOrderDto, PaginationDto } from './dto/order.dto';

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PLACED]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PACKED, OrderStatus.CANCELLED],
  [OrderStatus.PACKED]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.OUT_FOR_DELIVERY],
  [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [OrderStatus.RETURNED],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.RETURNED]: [],
};

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
  ) {}

  async create(userId: string, dto: CreateOrderDto): Promise<OrderDocument> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }
    const subtotal = dto.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const discount = dto.discount ?? 0;
    const total = Math.max(subtotal - discount, 0);
    const now = new Date();
    const orderNumber = `NXC${now.getTime()}`;

    return this.orderModel.create({
      orderNumber,
      user: new Types.ObjectId(userId),
      items: dto.items.map((item) => ({
        product: new Types.ObjectId(item.product),
        vendor: new Types.ObjectId(item.vendor),
        title: item.title,
        quantity: item.quantity,
        price: item.price,
      })),
      subtotal,
      discount,
      total,
      currency: dto.currency ?? 'INR',
      status: OrderStatus.PLACED,
      paymentMethod: dto.paymentMethod,
      shippingAddress: dto.shippingAddress,
      statusHistory: [{ status: OrderStatus.PLACED, at: now }],
      placedAt: now,
    });
  }

  async findUserOrders(
    userId: string,
    pagination: PaginationDto,
  ): Promise<{
    data: OrderDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;
    const filter = { user: new Types.ObjectId(userId) };
    const [data, total] = await Promise.all([
      this.orderModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.orderModel.countDocuments(filter).exec(),
    ]);
    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<OrderDocument> {
    const order = await this.orderModel.findById(id).exec();
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  findVendorOrders(vendorId: string): Promise<OrderDocument[]> {
    return this.orderModel
      .find({ 'items.vendor': new Types.ObjectId(vendorId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findAll(pagination: PaginationDto): Promise<{
    data: OrderDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;
    const [data, total] = await Promise.all([
      this.orderModel
        .find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.orderModel.countDocuments().exec(),
    ]);
    return { data, total, page, limit };
  }

  async updateStatus(
    id: string,
    status: OrderStatus,
    note?: string,
  ): Promise<OrderDocument> {
    const order = await this.findOne(id);
    const allowed = ALLOWED_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(status)) {
      throw new BadRequestException(
        `Cannot transition order from ${order.status} to ${status}`,
      );
    }
    order.status = status;
    order.statusHistory.push({ status, at: new Date(), note });
    return order.save();
  }

  async cancel(id: string, userId: string): Promise<OrderDocument> {
    const order = await this.findOne(id);
    if (order.user.toString() !== userId) {
      throw new BadRequestException('You can only cancel your own orders');
    }
    const allowed = ALLOWED_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(OrderStatus.CANCELLED)) {
      throw new BadRequestException(
        `Order cannot be cancelled in ${order.status} state`,
      );
    }
    order.status = OrderStatus.CANCELLED;
    order.statusHistory.push({
      status: OrderStatus.CANCELLED,
      at: new Date(),
      note: 'Cancelled by customer',
    });
    return order.save();
  }

  async requestReturn(id: string, userId: string): Promise<OrderDocument> {
    const order = await this.findOne(id);
    if (order.user.toString() !== userId) {
      throw new BadRequestException('You can only return your own orders');
    }
    const allowed = ALLOWED_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(OrderStatus.RETURNED)) {
      throw new BadRequestException(
        `Order cannot be returned in ${order.status} state`,
      );
    }
    order.status = OrderStatus.RETURNED;
    order.statusHistory.push({
      status: OrderStatus.RETURNED,
      at: new Date(),
      note: 'Return requested by customer',
    });
    return order.save();
  }

  async assignDelivery(
    id: string,
    deliveryUserId: string,
  ): Promise<OrderDocument> {
    const order = await this.findOne(id);
    order.deliveryPartner = new Types.ObjectId(deliveryUserId);
    return order.save();
  }
}
