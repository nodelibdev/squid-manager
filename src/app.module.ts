import { Module, Controller, Get } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WhitelistModule } from './whitelist/whitelist.module';

@Controller()
export class ConfigController {
  @Get('config.json')
  getConfig() {
    return { prefix: process.env.APP_PREFIX ?? '' };
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    WhitelistModule,
  ],
  controllers: [ConfigController],
})
export class AppModule {}
