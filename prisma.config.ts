import 'dotenv/config';
import { defineConfig } from 'prisma/config';

const DATABASE_URL: string | undefined = process.env.DATABASE_URL;

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url:
      DATABASE_URL ??
      'postgresql://placeholder:placeholder@localhost:5432/placeholder',
  },
});
