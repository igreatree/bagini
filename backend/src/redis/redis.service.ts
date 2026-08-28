import { Injectable, Inject } from "@nestjs/common";
import Redis from "ioredis";
import { REDIS_CLIENT } from "./redis.module";

@Injectable()
export class RedisService {
    constructor(@Inject(REDIS_CLIENT) private readonly redisClient: Redis) {}

    async setWithExpiry(
        key: string,
        value: string,
        expiryInSeconds: number,
    ): Promise<void> {
        await this.redisClient.set(key, value, "EX", expiryInSeconds);
    }

    async get(key: string): Promise<string | null> {
        return await this.redisClient.get(key);
    }

    async del(key: string): Promise<void> {
        await this.redisClient.del(key);
    }
}
