import {
    BadRequestException,
    ConflictException,
    Injectable,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UserService } from "../user/user.service";
import * as crypto from "crypto";
import * as bcrypt from "bcryptjs";
import * as express from "express";
import { User } from "../../generated/prisma/client";
import { RedisService } from "../redis/redis.service";
import { HttpService } from "@nestjs/axios";

@Injectable()
export class AuthService {
    constructor(
        private userService: UserService,
        private jwtService: JwtService,
        private redisService: RedisService,
        private httpService: HttpService,
    ) {}

    // async validateUser(phone: string): Promise<Omit<User, "password"> | null> {
    //     const user = await this.userService.findOne({ phone });
    //     if (user) {
    //         const valid = await bcrypt.compare(pass, user.password);
    //         if (valid) {
    //             return user;
    //         }
    //     }
    //     return null;
    // }

    async sendSmsCode(phone: string) {
        const code = crypto.randomInt(1000, 9999).toString();
        const redisKey = `phone_code:${phone}`;

        await this.redisService.setWithExpiry(redisKey, code, 300);

        const payload = {
            login: process.env.SMS_SERVICE_LOGIN || "",
            pass: process.env.SMS_SERVICE_PASSWORD || "",
            type: "flash",
            code: code,
            phone: phone,
            sms_originator: "RUSInfo",
            sms_text: `Ваш код подтверждения ${code}`,
            callback_url: "https://bagini.shop/",
        };

        console.log({ payload: payload.toString() });

        const headers = {
            "Content-Type": "application/x-www-form-urlencoded",
        };

        try {
            await this.httpService.post(
                "https://gateway.api.sc/flash/",
                JSON.stringify(payload),
                { headers },
            );
        } catch (error) {
            throw new Error(
                `Ошибка при отправке запроса: ${JSON.stringify(error)}`,
            );
        }

        return { message: "Код успешно отправлен" };
    }

    async verifySmsCode(
        phone: string,
        inputCode: string,
        res: express.Response,
    ) {
        const redisKey = `phone_code:${phone}`;
        const savedCode = await this.redisService.get(redisKey);

        if (!savedCode) {
            throw new BadRequestException("Код устарел или не отправлялся");
        }

        if (savedCode !== inputCode) {
            throw new BadRequestException("Неверный код");
        }

        await this.redisService.del(redisKey);

        let user = await this.userService.findOne({ phone });
        if (!user) {
            user = await this.userService.create({
                phone,
            });
        }
        const payload = {
            sub: user.id,
            phone: user.phone,
            role: user.role,
        };

        const access_token = await this.jwtService.signAsync(payload);

        res.cookie("access_token", access_token, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 400 * 24 * 60 * 60 * 1000, // 400d
        });

        return { user };
    }
}
