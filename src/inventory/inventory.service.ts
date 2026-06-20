import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Inventory, InventoryDocument } from './schemas/inventory.schema';

@Injectable()
export class InventoryService {
  constructor(
    @InjectModel(Inventory.name)
    private readonly inventoryModel: Model<InventoryDocument>,
  ) {}

  async getByProduct(productId: string): Promise<InventoryDocument> {
    const inventory = await this.inventoryModel
      .findOne({ product: productId })
      .exec();
    if (!inventory) {
      throw new NotFoundException('Inventory not found for product');
    }
    return inventory;
  }

  async adjust(productId: string, delta: number): Promise<InventoryDocument> {
    const inventory = await this.inventoryModel
      .findOne({ product: productId })
      .exec();
    if (!inventory) {
      throw new NotFoundException('Inventory not found for product');
    }
    if (inventory.quantity + delta < 0) {
      throw new BadRequestException('Quantity cannot go below zero');
    }
    inventory.quantity += delta;
    return inventory.save();
  }

  async reserve(productId: string, qty: number): Promise<InventoryDocument> {
    const inventory = await this.inventoryModel
      .findOne({ product: productId })
      .exec();
    if (!inventory) {
      throw new NotFoundException('Inventory not found for product');
    }
    const available = inventory.quantity - inventory.reserved;
    if (qty > available) {
      throw new BadRequestException('Insufficient stock to reserve');
    }
    inventory.reserved += qty;
    return inventory.save();
  }

  async release(productId: string, qty: number): Promise<InventoryDocument> {
    const inventory = await this.inventoryModel
      .findOne({ product: productId })
      .exec();
    if (!inventory) {
      throw new NotFoundException('Inventory not found for product');
    }
    inventory.reserved = Math.max(0, inventory.reserved - qty);
    return inventory.save();
  }
}
