import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { MachinesModule } from './machines/machines.module';
import { ConfigModule } from '@nestjs/config';
import { EventsModule } from './events/events.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    MachinesModule,
    EventsModule,
  ],
})
export class AppModule {}
