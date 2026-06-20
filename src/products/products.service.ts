import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import {
  Product,
  ProductDocument,
  ProductStatus,
} from './schemas/product.schema';
import {
  CreateProductDto,
  FindProductsQueryDto,
  UpdateProductDto,
} from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  create(vendorId: string, dto: CreateProductDto): Promise<ProductDocument> {
    return this.productModel.create({
      ...dto,
      vendor: vendorId,
      status: ProductStatus.PENDING,
    });
  }

  async update(id: string, dto: UpdateProductDto): Promise<ProductDocument> {
    const product = await this.productModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async remove(id: string): Promise<void> {
    const result = await this.productModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Product not found');
    }
  }

  async findAll(query: FindProductsQueryDto): Promise<{
    data: ProductDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 20;

    const filter: FilterQuery<ProductDocument> = {
      status: ProductStatus.APPROVED,
      isActive: true,
    };

    if (query.category) {
      filter.category = query.category;
    }
    if (query.brand) {
      filter.brand = query.brand;
    }
    if (query.search) {
      filter.title = { $regex: query.search, $options: 'i' };
    }
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      filter.price = {};
      if (query.minPrice !== undefined) {
        filter.price.$gte = query.minPrice;
      }
      if (query.maxPrice !== undefined) {
        filter.price.$lte = query.maxPrice;
      }
    }

    const [data, total] = await Promise.all([
      this.productModel
        .find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.productModel.countDocuments(filter).exec(),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<ProductDocument> {
    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async approve(id: string): Promise<ProductDocument> {
    const product = await this.productModel
      .findByIdAndUpdate(
        id,
        { status: ProductStatus.APPROVED, rejectionReason: null },
        { new: true },
      )
      .exec();
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async reject(id: string, reason: string): Promise<ProductDocument> {
    const product = await this.productModel
      .findByIdAndUpdate(
        id,
        { status: ProductStatus.REJECTED, rejectionReason: reason },
        { new: true },
      )
      .exec();
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  findByVendor(vendorId: string): Promise<ProductDocument[]> {
    return this.productModel.find({ vendor: vendorId }).exec();
  }

  bulkUpload(
    vendorId: string,
    products: CreateProductDto[],
  ): Promise<ProductDocument[]> {
    const docs = products.map((p) => ({
      ...p,
      vendor: vendorId,
      status: ProductStatus.PENDING,
    }));
    return this.productModel.insertMany(docs) as unknown as Promise<
      ProductDocument[]
    >;
  }
}
