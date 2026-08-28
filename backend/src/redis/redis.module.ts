import { Global, Module, Provider } from "@nestjs/common";
import Redis from "ioredis";

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
    providers: [redisProvider],
    exports: [REDIS_CLIENT],
})
export class RedisModule {}
