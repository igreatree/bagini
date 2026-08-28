import { Injectable } from "@nestjs/common";
import { Prisma, Program } from "../../generated/prisma/client";
import { PrismaService } from "../prisma.service";
import { GetQueryDto } from "../types";
import { ProgramDto } from "./program.controller";

@Injectable()
export class ProgramService {
    constructor(private prisma: PrismaService) {}

    async create(data: ProgramDto) {
        const program = await this.prisma.program.create({
            data,
        });
        return { program };
    }

    async findAll(
        query: GetQueryDto,
    ): Promise<{ programs: Program[]; total: number }> {
        const { skip, take, search, sortBy, sortOrder } = query;

        const where: Prisma.ProgramWhereInput = {};

        if (search) {
            where.OR = [
                {
                    name: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
                {
                    description: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
            ];
        }

        const orderBy: Prisma.ProgramOrderByWithRelationInput = {};
        if (sortBy && sortOrder) {
            orderBy[sortBy] = sortOrder;
        }

        const [programs, total] = await Promise.all([
            this.prisma.program.findMany({
                skip,
                take,
                where,
                orderBy,
            }),
            this.prisma.program.count({
                where,
            }),
        ]);

        return { programs, total };
    }

    async findOne(where: Prisma.ProgramWhereUniqueInput) {
        const program = await this.prisma.program.findUnique({ where });
        return { program };
    }

    async update(params: {
        where: Prisma.ProgramWhereUniqueInput;
        data: Prisma.ProgramUpdateInput;
    }) {
        const program = await this.prisma.program.update(params);
        return { program };
    }

    async delete(where: Prisma.ProgramWhereUniqueInput) {
        const program = await this.prisma.program.delete({ where });
        return { program };
    }
}
