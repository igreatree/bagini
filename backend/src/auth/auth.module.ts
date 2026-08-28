import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { UserModule } from "../user/user.module";
import { PassportModule } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { JwtCookieStrategy } from "./jwtCookie.stategy";
import { AuthController } from "./auth.controller";
import { HttpModule } from "@nestjs/axios";

@Module({
    imports: [
        UserModule,
        PassportModule,
        JwtModule.register({
            global: true,
            secret: process.env.JWT_SECRET,
            signOptions: { expiresIn: "7d" },
        }),
        HttpModule,
    ],
    providers: [AuthService, JwtCookieStrategy],
    exports: [AuthService],
    controllers: [AuthController],
})
export class AuthModule {}
