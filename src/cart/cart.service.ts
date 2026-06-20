import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart, CartDocument } from './schemas/cart.schema';
import { AddCartItemDto } from './dto/cart.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private readonly cartModel: Model<CartDocument>,
  ) {}

  async getCart(userId: string): Promise<CartDocument> {
    let cart = await this.cartModel.findOne({ user: userId }).exec();
    if (!cart) {
      cart = await this.cartModel.create({ user: userId, items: [] });
    }
    return cart;
  }

  async addItem(userId: string, dto: AddCartItemDto): Promise<CartDocument> {
    const cart = await this.getCart(userId);
    const existing = cart.items.find(
      (item) => item.product.toString() === dto.product,
    );
    if (existing) {
      existing.quantity += dto.quantity;
      existing.price = dto.price;
    } else {
      cart.items.push({
        product: new Types.ObjectId(dto.product),
        vendor: new Types.ObjectId(dto.vendor),
        quantity: dto.quantity,
        price: dto.price,
      });
    }
    await cart.save();
    return cart;
  }

  async updateItem(
    userId: string,
    itemId: string,
    quantity: number,
  ): Promise<CartDocument> {
    const cart = await this.getCart(userId);
    const item = cart.items.find((i) => (i as any)._id?.toString() === itemId);
    if (!item) {
      throw new NotFoundException('Cart item not found');
    }
    item.quantity = quantity;
    await cart.save();
    return cart;
  }

  async removeItem(userId: string, itemId: string): Promise<CartDocument> {
    const cart = await this.getCart(userId);
    const before = cart.items.length;
    cart.items = cart.items.filter(
      (i) => (i as any)._id?.toString() !== itemId,
    );
    if (cart.items.length === before) {
      throw new NotFoundException('Cart item not found');
    }
    await cart.save();
    return cart;
  }

  async clear(userId: string): Promise<CartDocument> {
    const cart = await this.getCart(userId);
    cart.items = [];
    await cart.save();
    return cart;
  }
}
