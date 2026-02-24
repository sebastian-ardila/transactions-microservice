import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities';

/** Handles user-related business logic. */
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  /** Finds a user by ID. Returns `null` if not found. */
  async findOne(userId: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { userId } });
  }

  /** Returns the current balance for a user. Throws if user does not exist. */
  async getBalance(userId: string): Promise<{ userId: string; balance: number }> {
    const user = await this.findOne(userId);
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }
    return { userId: user.userId, balance: user.balance };
  }
}
