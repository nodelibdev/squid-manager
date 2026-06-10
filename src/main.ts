import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const prefix = process.env.APP_PREFIX ?? '';

  // Serve index.html với BASE_PATH được inject
  app.use(`${prefix}/`, (req: any, res: any, next: any) => {
    if (req.path === '/' && req.method === 'GET') {
      return res.sendFile(join(__dirname, '..', 'public', 'index.html'));
    }
    next();
  });

  app.useStaticAssets(join(__dirname, '..', 'public'));

  if (prefix) {
    app.setGlobalPrefix(prefix, { exclude: ['config.json'] });
  }

  await app.listen(3000);
  console.log(`Squid Manager running on :3000 (prefix: "${prefix}")`);
}

bootstrap();
