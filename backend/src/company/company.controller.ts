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
import { CompanyService } from "./company.service";
import type {
    CompanyCreateInput,
    CompanyUpdateInput,
} from "../../generated/prisma/models";
import { JwtCookieAuthGuard } from "../auth/guards/jwtCookie-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/role.decorator";
import { GetQueryDto } from "../types";

@Controller("company")
export class CompanyController {
    constructor(private readonly companyService: CompanyService) {}

    @UseGuards(JwtCookieAuthGuard)
    @Get("all")
    findAll(@Query() query: GetQueryDto) {
        return this.companyService.findAll(query);
    }

    @UseGuards(JwtCookieAuthGuard)
    @Get(":id")
    findOne(@Param("id") id: string) {
        return this.companyService.findOne({ id });
    }

    @UseGuards(JwtCookieAuthGuard, RolesGuard)
    @Roles("admin")
    @Post()
    create(@Body() data: CompanyCreateInput) {
        return this.companyService.create(data);
    }

    @UseGuards(JwtCookieAuthGuard, RolesGuard)
    @Roles("admin")
    @Put(":id")
    update(@Param("id") id: string, @Body() data: CompanyUpdateInput) {
        return this.companyService.update({
            where: { id },
            data,
        });
    }

    @UseGuards(JwtCookieAuthGuard, RolesGuard)
    @Roles("admin")
    @Delete(":id")
    delete(@Param("id") id: string) {
        return this.companyService.delete({ id });
    }
}
