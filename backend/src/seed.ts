import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DemoService } from './demo/demo.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const demoService = app.get(DemoService);
    
    console.log('Resetting demo data...');
    await demoService.resetDemoData();
    console.log('Done!');
    
    await app.close();
    process.exit(0);
}

bootstrap();
