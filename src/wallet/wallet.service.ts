import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  WalletTransaction,
  WalletTransactionDocument,
} from './schemas/wallet-transaction.schema';
import { Wallet, WalletDocument } from './schemas/wallet.schema';
import { WalletPaginationDto } from './dto/wallet.dto';

@Injectable()
export class WalletService {
  constructor(
    @InjectModel(Wallet.name)
    private readonly walletModel: Model<WalletDocument>,
    @InjectModel(WalletTransaction.name)
    private readonly txModel: Model<WalletTransactionDocument>,
  ) {}

  async getOrCreate(userId: string): Promise<WalletDocument> {
    const userObjectId = new Types.ObjectId(userId);
    let wallet = await this.walletModel.findOne({ user: userObjectId }).exec();
    if (!wallet) {
      wallet = await this.walletModel.create({
        user: userObjectId,
        balance: 0,
        currency: 'INR',
      });
    }
    return wallet;
  }

  async getBalance(
    userId: string,
  ): Promise<{ balance: number; currency: string }> {
    const wallet = await this.getOrCreate(userId);
    return { balance: wallet.balance, currency: wallet.currency };
  }

  async addMoney(
    userId: string,
    amount: number,
    reason: string,
    reference?: string,
  ): Promise<WalletTransactionDocument> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }
    const wallet = await this.getOrCreate(userId);
    wallet.balance += amount;
    await wallet.save();
    return this.txModel.create({
      wallet: wallet._id,
      user: wallet.user,
      type: 'credit',
      amount,
      balanceAfter: wallet.balance,
      reason,
      reference,
    });
  }

  async debit(
    userId: string,
    amount: number,
    reason: string,
    reference?: string,
  ): Promise<WalletTransactionDocument> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }
    const wallet = await this.getOrCreate(userId);
    if (wallet.balance < amount) {
      throw new BadRequestException('Insufficient wallet balance');
    }
    wallet.balance -= amount;
    await wallet.save();
    return this.txModel.create({
      wallet: wallet._id,
      user: wallet.user,
      type: 'debit',
      amount,
      balanceAfter: wallet.balance,
      reason,
      reference,
    });
  }

  withdraw(
    userId: string,
    amount: number,
    reason = 'Withdrawal',
  ): Promise<WalletTransactionDocument> {
    return this.debit(userId, amount, reason);
  }

  async history(
    userId: string,
    pagination: WalletPaginationDto,
  ): Promise<{
    data: WalletTransactionDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;
    const filter = { user: new Types.ObjectId(userId) };
    const [data, total] = await Promise.all([
      this.txModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.txModel.countDocuments(filter).exec(),
    ]);
    return { data, total, page, limit };
  }
}
