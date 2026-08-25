import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from 'prisma/generated/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      log: ['error', 'info', 'query', 'warn'],
      adapter: new PrismaPg({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        max: 20,
      }),
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
    } catch (error: unknown) {
      console.error('Prisma Postgres connection failed', { error });
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
    } catch (error: unknown) {
      console.error('Prisma Postgres disconnect failed', { error });
    }
  }
}
