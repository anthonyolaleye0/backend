import { Controller, Get, Param, Query } from '@nestjs/common';
import { QueryWithPaginationDto } from '../../common/dto/query-with-pagination';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('get-a-user-by-id/:userId')
  async findAUserById(@Param('userId') userId: string) {
    return await this.usersService.findUserById(userId);
  }

  @Get('get-all-users')
  async findAllUsers(@Query() queryWithPaginationDto: QueryWithPaginationDto) {
    console.log('queryWithPaginationDto:', queryWithPaginationDto);
    return await this.usersService.findAllUsers(queryWithPaginationDto);
  }
}
