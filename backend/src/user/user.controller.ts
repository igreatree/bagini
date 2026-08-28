import {
    Controller,
    Get,
    Request,
    Body,
    Param,
    Delete,
    NotFoundException,
    Put,
    UseGuards,
    Post,
    Query,
} from "@nestjs/common";
import { UserService } from "./user.service";
import { JwtCookieAuthGuard } from "../auth/guards/jwtCookie-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/role.decorator";
import { GetQueryDto } from "../types";
import type { UserUpdateInput } from "../../generated/prisma/models";

@Controller("user")
export class UserController {
    constructor(private readonly userService: UserService) {}

    @UseGuards(JwtCookieAuthGuard, RolesGuard)
    @Roles("admin")
    @Get("all")
    findAll(@Query() query: GetQueryDto) {
        return this.userService.findAll(query);
    }

    @Get()
    async getCurrentUser(@Request() req) {
        const user = await this.userService.findOne({ id: req.user.id });
        if (!user) throw new NotFoundException("Пользователь не найден");
        return { user };
    }

    @Get(":id")
    findOne(@Param("id") id: number) {
        return this.userService.findOne({ id });
    }

    @UseGuards(JwtCookieAuthGuard)
    @Put()
    update(@Request() req, @Body() data: UserUpdateInput) {
        return this.userService.update({ where: { id: req.user.id }, data });
    }

    @UseGuards(JwtCookieAuthGuard)
    @Delete()
    delete(@Request() req) {
        return this.userService.delete({ id: req.user.id });
    }
}
