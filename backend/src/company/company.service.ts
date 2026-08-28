import { Injectable } from "@nestjs/common";
import { Prisma, Company } from "../../generated/prisma/client";
import { PrismaService } from "../prisma.service";
import type { CompanyCreateInput } from "../../generated/prisma/models";
import { GetQueryDto } from "../types";

@Injectable()
export class CompanyService {
    constructor(private prisma: PrismaService) {}

    async create(data: CompanyCreateInput) {
        const company = await this.prisma.company.create({
            data,
        });
        return { company };
    }

    async findAll(
        query: GetQueryDto,
    ): Promise<{ companies: Company[]; total: number }> {
        const { skip, take, search, sortBy, sortOrder } = query;

        const where: Prisma.CompanyWhereInput = {};

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
                {
                    inn: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
            ];
        }

        const orderBy: Prisma.CompanyOrderByWithRelationInput = {};
        if (sortBy && sortOrder) {
            orderBy[sortBy] = sortOrder;
        }

        const [companies, total] = await Promise.all([
            this.prisma.company.findMany({
                skip,
                take,
                where,
                orderBy,
            }),
            this.prisma.company.count({
                where,
            }),
        ]);

        return { companies, total };
    }

    async findOne(where: Prisma.CompanyWhereUniqueInput) {
        const company = await this.prisma.company.findUnique({ where });
        return { company };
    }

    async update(params: {
        where: Prisma.CompanyWhereUniqueInput;
        data: Prisma.CompanyUpdateInput;
    }) {
        const company = await this.prisma.company.update(params);
        return { company };
    }

    async delete(where: Prisma.CompanyWhereUniqueInput) {
        const company = await this.prisma.company.delete({ where });
        return { company };
    }
}
