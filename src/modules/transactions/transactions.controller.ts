import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto';

/** REST controller for transaction-related endpoints. */
@ApiTags('Transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  /** Creates a new transaction (deposit or withdrawal). */
  @Post()
  @ApiOperation({ summary: 'Create a transaction' })
  @ApiResponse({ status: 201, description: 'Transaction created successfully' })
  @ApiResponse({ status: 400, description: 'Insufficient balance or invalid data' })
  @ApiResponse({ status: 404, description: 'User not found (withdraw only)' })
  create(@Body() dto: CreateTransactionDto) {
    return this.transactionsService.create(dto);
  }

  /** Returns all transactions for a specific user. */
  @Get('user/:userId')
  @ApiOperation({ summary: 'Get transaction history by user' })
  @ApiParam({ name: 'userId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Transaction history retrieved' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findByUserId(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.transactionsService.findByUserId(userId);
  }
}
