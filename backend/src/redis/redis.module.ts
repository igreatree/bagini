import { Global, Module, Provider } from "@nestjs/common";
import Redis from "ioredis";
import { RedisService } from "./redis.service";

export const REDIS_CLIENT = "REDIS_CLIENT";

const redisProvider: Provider = {
    provide: REDIS_CLIENT,
    useFactory: () => {
        return new Redis({
            host: "localhost",
            port: 6379,
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
