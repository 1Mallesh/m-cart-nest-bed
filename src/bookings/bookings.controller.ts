import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AuthUser,
  CurrentUser,
} from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { BookingsService } from './bookings.service';
import { BookBusDto, BookFlightDto, SearchTravelDto } from './dto/bookings.dto';

@ApiTags('bookings')
@Controller({ version: '1' })
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Get('flights/search')
  @ApiOperation({ summary: 'Search flights' })
  searchFlights(@Query() dto: SearchTravelDto) {
    return this.bookings.searchFlights(dto.from, dto.to, dto.date);
  }

  @Post('flights/book')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Book a flight' })
  bookFlight(@CurrentUser() user: AuthUser, @Body() dto: BookFlightDto) {
    return this.bookings.bookFlight(user.userId, dto);
  }

  @Get('flights/tickets')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'List my flight tickets' })
  flightTickets(@CurrentUser() user: AuthUser) {
    return this.bookings.listFlightTickets(user.userId);
  }

  @Get('bus/search')
  @ApiOperation({ summary: 'Search buses' })
  searchBuses(@Query() dto: SearchTravelDto) {
    return this.bookings.searchBuses(dto.from, dto.to, dto.date);
  }

  @Post('bus/book')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Book a bus' })
  bookBus(@CurrentUser() user: AuthUser, @Body() dto: BookBusDto) {
    return this.bookings.bookBus(user.userId, dto);
  }

  @Get('bus/tickets')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'List my bus tickets' })
  busTickets(@CurrentUser() user: AuthUser) {
    return this.bookings.listBusTickets(user.userId);
  }
}
