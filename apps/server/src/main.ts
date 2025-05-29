import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Enable CORS - Allow mobile app connections
  app.enableCors({
    origin: [
      'http://localhost:3000', // Web frontend
      'http://192.168.29.85:8081', // Expo Dev Server
      'exp://192.168.29.85:8081', // Expo Go
      'http://192.168.29.85:19000', // Expo Dev Tools
      'http://192.168.29.85:19001', // Expo Metro bundler
      /^http:\/\/192\.168\.29\.\d+/, // Allow any device on local network
    ],
    credentials: true,
  });

  // Set global prefix
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT || 3000;
  // Bind to all interfaces (0.0.0.0) instead of just localhost
  await app.listen(port, '0.0.0.0');

  console.log(`Application is running on: http://0.0.0.0:${port}/api/v1`);
  console.log(`Local access: http://localhost:${port}/api/v1`);
  console.log(`Network access: http://192.168.29.85:${port}/api/v1`);
}

void bootstrap();
