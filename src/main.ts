import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { RedisStreamsAdapter } from './websocket/redis-streams.adapter.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  if (!(app as any).socketModule) {
    try {
      const { SocketModule } = await import('@nestjs/websockets/socket-module' as any);
      Object.defineProperty(app, 'socketModule', {
        value: new SocketModule(),
        writable: true,
        configurable: true,
      });
    } catch {}
  }

  app.useWebSocketAdapter(new RedisStreamsAdapter(app))
  app.useStaticAssets(join(process.cwd(), 'public'));
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
