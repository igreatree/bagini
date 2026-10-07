import { Type } from "class-transformer";
import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsInt,
    IsOptional,
    IsString,
    Length,
    Max,
    Min,
    ValidateNested,
} from "class-validator";

export class OrderItemDto {
    @IsString()
    productId!: string;

    @IsInt()
    @Min(1)
    @Max(99)
    quantity!: number;
}

export class CalculateOrderDto {
    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(50)
    @ValidateNested({ each: true })
    @Type(() => OrderItemDto)
    items!: OrderItemDto[];
}

export class CreateOrderDto extends CalculateOrderDto {
    @IsString()
    @Length(2, 100)
    recipientName!: string;

    @IsString()
    @Length(2, 100)
    city!: string;

    @IsString()
    @Length(5, 255)
    address!: string;

    @IsOptional()
    @IsString()
    @Length(6, 6)
    postalCode?: string;

    @IsOptional()
    @IsString()
    @Length(0, 500)
    comment?: string;
}
