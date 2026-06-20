import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Wishlist, WishlistDocument } from './schemas/wishlist.schema';

@Injectable()
export class WishlistService {
  constructor(
    @InjectModel(Wishlist.name)
    private readonly wishlistModel: Model<WishlistDocument>,
  ) {}

  async get(userId: string): Promise<WishlistDocument> {
    let wishlist = await this.wishlistModel.findOne({ user: userId }).exec();
    if (!wishlist) {
      wishlist = await this.wishlistModel.create({
        user: userId,
        products: [],
      });
    }
    return wishlist;
  }

  async add(userId: string, productId: string): Promise<WishlistDocument> {
    const wishlist = await this.get(userId);
    const exists = wishlist.products.some((p) => p.toString() === productId);
    if (!exists) {
      wishlist.products.push(new Types.ObjectId(productId));
      await wishlist.save();
    }
    return wishlist;
  }

  async remove(userId: string, productId: string): Promise<WishlistDocument> {
    const wishlist = await this.get(userId);
    wishlist.products = wishlist.products.filter(
      (p) => p.toString() !== productId,
    );
    await wishlist.save();
    return wishlist;
  }
}
