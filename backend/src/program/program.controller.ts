import {
    Controller,
    Get,
    Body,
    Param,
    Delete,
    Put,
    Post,
    UseGuards,
    Query,
} from "@nestjs/common";
import { ProgramService } from "./program.service";
import type { ProgramUpdateInput } from "../../generated/prisma/models";
import { JwtCookieAuthGuard } from "../auth/guards/jwtCookie-auth.guard";
import { IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/role.decorator";
import { GetQueryDto } from "../types";

export class ProgramDto {
    @IsNotEmpty()
    @IsString()
    name: string = "";

    @IsNotEmpty()
    @IsInt()
    sdoId: number = 0;

    @IsOptional()
    @IsString()
    description?: string = "";

    @IsOptional()
    @IsInt()
    hours?: number = 0;

    @IsOptional()
    @IsInt()
    attempts?: number = 0;
}

@Controller("program")
export class ProgramController {
    constructor(private readonly programService: ProgramService) {}

    @UseGuards(JwtCookieAuthGuard)
    @Get("all")
    findAll(@Query() query: GetQueryDto) {
        return this.programService.findAll(query);
    }

    @UseGuards(JwtCookieAuthGuard)
    @Get(":id")
    findOne(@Param("id") id: string) {
        return this.programService.findOne({ id });
    }

    @UseGuards(JwtCookieAuthGuard, RolesGuard)
    @Roles("admin")
    @Post()
    create(@Body() data: ProgramDto) {
        return this.programService.create(data);
    }

    @UseGuards(JwtCookieAuthGuard, RolesGuard)
    @Roles("admin")
    @Put(":id")
    update(@Param("id") id: string, @Body() data: ProgramUpdateInput) {
        return this.programService.update({
            where: { id },
            data,
        });
    }

    @UseGuards(JwtCookieAuthGuard, RolesGuard)
    @Roles("admin")
    @Delete(":id")
    delete(@Param("id") id: string) {
        return this.programService.delete({ id });
    }
}
