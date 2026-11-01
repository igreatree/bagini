import { Global, Module, Provider } from "@nestjs/common";
import Redis from "ioredis";
import { RedisService } from "./redis.service";
import { REDIS_CLIENT } from "../constants";

const redisProvider: Provider = {
    provide: REDIS_CLIENT,
    useFactory: () => {
        return new Redis({
            host: process.env.REDIS_HOST || "localhost",
            port: parseInt(process.env.REDIS_PORT || "6379", 10),
            // Для Redis с requirepass; без них подключаемся как раньше, без авторизации
            username: process.env.REDIS_USERNAME || undefined,
            password: process.env.REDIS_PASSWORD || undefined,
        });
    },
};

@Global()
@Module({
    providers: [redisProvider, RedisService],
    exports: [REDIS_CLIENT, RedisService],
})
export class RedisModule {}
