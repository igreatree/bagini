import * as express from "express";
import {
    Body,
    Controller,
    Post,
    Res,
    UseGuards,
    Request,
    Get,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LocalAuthGuard } from "./guards/local-auth.guard";
import { JwtCookieAuthGuard } from "./guards/jwtCookie-auth.guard";
import { RolesGuard } from "./guards/roles.guard";
import { Roles } from "./decorators/role.decorator";

@Controller("auth")
export class AuthController {
    constructor(private authService: AuthService) {}

    @Get("logout")
    async logout(@Res({ passthrough: true }) res: express.Response) {
        res.clearCookie("access_token", {
            httpOnly: true,
            secure: true,
            sameSite: "none",
        });
        return { success: true };
    }

    @Post("send-sms-code")
    async sendSmsCode(@Body("phone") phone: string) {
        return this.authService.sendSmsCode(phone);
    }

    @Post("verify-sms-code")
    async verifySmsCode(
        @Body("phone") phone: string,
        @Body("code") code: string,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return this.authService.verifySmsCode(phone, code, res);
    }

    @UseGuards(JwtCookieAuthGuard)
    @Get("check")
    check(@Request() req) {
        return { role: req.user.role };
    }

    @UseGuards(JwtCookieAuthGuard, RolesGuard)
    @Roles("admin")
    @Get("admin")
    checkAdmin(@Request() req) {
        return { role: req.user.role };
    }

    @UseGuards(JwtCookieAuthGuard, RolesGuard)
    @Get("moderator")
    checkModerator(@Request() req) {
        return { role: req.user.role };
    }
}
