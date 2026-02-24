import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';

/** REST controller for user-related endpoints. */
@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** Returns the current balance for a specific user. */
  @Get(':userId/balance')
  @ApiOperation({ summary: 'Get user balance' })
  @ApiParam({ name: 'userId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'User balance retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  getBalance(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.usersService.getBalance(userId);
  }
}
