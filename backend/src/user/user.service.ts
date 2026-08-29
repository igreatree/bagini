import { ConflictException, Injectable } from "@nestjs/common";
import { Prisma, User } from "../../generated/prisma/client";
import { PrismaService } from "../prisma.service";
import * as bcrypt from "bcryptjs";
import { GetQueryDto } from "../types";

@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) {}

    create(data: Prisma.UserCreateInput) {
        return this.prisma.user.create({ data });
    }

    async findAll(query: GetQueryDto): Promise<{
        users: User[];
        total: number;
    }> {
        const { skip, take, search, sortBy, sortOrder } = query;

        const where: Prisma.UserWhereInput = {};

        if (search) {
            where.OR = [
                {
                    name: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
                {
                    lastName: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
                {
                    phone: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
                {
                    email: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
            ];
        }

        const orderBy: Prisma.UserOrderByWithRelationInput = {};
        if (sortBy && sortOrder) {
            orderBy[sortBy] = sortOrder;
        }

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                skip,
                take,
                where,
                orderBy,
            }),
            this.prisma.user.count({
                where,
            }),
        ]);

        return {
            users,
            total,
        };
    }

    findOne(where: Prisma.UserWhereUniqueInput) {
        return this.prisma.user.findUnique({
            where,
        });
    }

    async update(params: {
        where: Prisma.UserWhereUniqueInput;
        data: Prisma.UserUpdateInput;
    }) {
        const user = await this.prisma.user.update(params);
        return { user };
    }

    delete(where: Prisma.UserWhereUniqueInput) {
        return this.prisma.user.delete({ where });
    }
}
