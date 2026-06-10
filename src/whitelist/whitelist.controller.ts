import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { BearerAuthGuard } from '../auth/bearer-auth.guard';
import { WhitelistService, ListType } from './whitelist.service';

const VALID_TYPES: ListType[] = ['domain', 'ip'];

function assertType(type: string): ListType {
  if (!VALID_TYPES.includes(type as ListType))
    throw new BadRequestException('Invalid type');
  return type as ListType;
}

@Controller('api')
@UseGuards(BearerAuthGuard)
export class WhitelistController {
  constructor(private readonly svc: WhitelistService) {}

  @Post('reload')
  @HttpCode(200)
  async reload() {
    await this.svc.reloadSquid();
    return { ok: true };
  }

  @Get(':type')
  getList(@Param('type') type: string) {
    return { entries: this.svc.getList(assertType(type)) };
  }

  @Post(':type')
  addEntry(@Param('type') type: string, @Body('entry') entry: string) {
    return { entries: this.svc.addEntry(assertType(type), entry) };
  }

  @Delete(':type')
  deleteEntry(@Param('type') type: string, @Body('entry') entry: string) {
    return { entries: this.svc.deleteEntry(assertType(type), entry) };
  }
}
