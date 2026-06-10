import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WhitelistModule } from './whitelist/whitelist.module';

@Module({
  imports: [
    WhitelistModule,
    ConfigModule.forRoot({ isGlobal: true }),
  ],
})
export class AppModule {}
