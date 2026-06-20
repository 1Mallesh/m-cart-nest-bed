import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomUUID } from 'crypto';
import { Model, Types } from 'mongoose';
import { Flight, FlightDocument } from './schemas/flight.schema';
import {
  FlightBooking,
  FlightBookingDocument,
} from './schemas/flight-booking.schema';
import { Bus, BusDocument } from './schemas/bus.schema';
import { BusBooking, BusBookingDocument } from './schemas/bus-booking.schema';
import { BookBusDto, BookFlightDto } from './dto/bookings.dto';

@Injectable()
export class BookingsService {
  constructor(
    @InjectModel(Flight.name)
    private readonly flightModel: Model<FlightDocument>,
    @InjectModel(FlightBooking.name)
    private readonly flightBookingModel: Model<FlightBookingDocument>,
    @InjectModel(Bus.name)
    private readonly busModel: Model<BusDocument>,
    @InjectModel(BusBooking.name)
    private readonly busBookingModel: Model<BusBookingDocument>,
  ) {}

  private generatePnr(): string {
    return randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
  }

  private dayRange(date?: string): { $gte: Date; $lt: Date } | undefined {
    if (!date) {
      return undefined;
    }
    const start = new Date(`${date}T00:00:00.000Z`);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    return { $gte: start, $lt: end };
  }

  searchFlights(
    from: string,
    to: string,
    date?: string,
  ): Promise<FlightDocument[]> {
    const query: Record<string, unknown> = { from, to };
    const range = this.dayRange(date);
    if (range) {
      query.departAt = range;
    }
    return this.flightModel.find(query).sort({ departAt: 1 }).exec();
  }

  async bookFlight(
    userId: string,
    dto: BookFlightDto,
  ): Promise<FlightBookingDocument> {
    const seatsNeeded = dto.passengers.length;
    const flight = await this.flightModel
      .findOneAndUpdate(
        { _id: dto.flightId, seatsAvailable: { $gte: seatsNeeded } },
        { $inc: { seatsAvailable: -seatsNeeded } },
        { new: true },
      )
      .exec();
    if (!flight) {
      const exists = await this.flightModel.exists({ _id: dto.flightId });
      if (!exists) {
        throw new NotFoundException('Flight not found');
      }
      throw new BadRequestException('Not enough seats available');
    }
    return this.flightBookingModel.create({
      user: new Types.ObjectId(userId),
      flight: flight._id,
      passengers: dto.passengers,
      pnr: this.generatePnr(),
      status: 'booked',
      amount: flight.price * seatsNeeded,
    });
  }

  listFlightTickets(userId: string): Promise<FlightBookingDocument[]> {
    return this.flightBookingModel
      .find({ user: userId })
      .populate('flight')
      .sort({ createdAt: -1 })
      .exec();
  }

  searchBuses(from: string, to: string, date?: string): Promise<BusDocument[]> {
    const query: Record<string, unknown> = { from, to };
    const range = this.dayRange(date);
    if (range) {
      query.departAt = range;
    }
    return this.busModel.find(query).sort({ departAt: 1 }).exec();
  }

  async bookBus(userId: string, dto: BookBusDto): Promise<BusBookingDocument> {
    const seatsNeeded = dto.seats.length;
    const bus = await this.busModel
      .findOneAndUpdate(
        { _id: dto.busId, seatsAvailable: { $gte: seatsNeeded } },
        { $inc: { seatsAvailable: -seatsNeeded } },
        { new: true },
      )
      .exec();
    if (!bus) {
      const exists = await this.busModel.exists({ _id: dto.busId });
      if (!exists) {
        throw new NotFoundException('Bus not found');
      }
      throw new BadRequestException('Not enough seats available');
    }
    return this.busBookingModel.create({
      user: new Types.ObjectId(userId),
      bus: bus._id,
      seats: dto.seats,
      pnr: this.generatePnr(),
      status: 'booked',
      amount: bus.price * seatsNeeded,
    });
  }

  listBusTickets(userId: string): Promise<BusBookingDocument[]> {
    return this.busBookingModel
      .find({ user: userId })
      .populate('bus')
      .sort({ createdAt: -1 })
      .exec();
  }
}
