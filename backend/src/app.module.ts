import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { UserModule } from "./user/user.module";
import { PrismaModule } from "./prisma.module";
import { AuthModule } from "./auth/auth.module";
import { RedisModule } from "./redis/redis.module";
import { HttpModule } from "@nestjs/axios";

@Module({
    imports: [PrismaModule, RedisModule, HttpModule, UserModule, AuthModule],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
