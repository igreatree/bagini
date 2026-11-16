import { Type } from "class-transformer";
import { IsNumber, Max, Min } from "class-validator";

export class MapPointsDto {
    @Type(() => Number)
    @IsNumber()
    @Min(-85)
    @Max(85)
    south!: number;

    @Type(() => Number)
    @IsNumber()
    @Min(-85)
    @Max(85)
    north!: number;

    @Type(() => Number)
    @IsNumber()
    @Min(-180)
    @Max(180)
    west!: number;

    @Type(() => Number)
    @IsNumber()
    @Min(-180)
    @Max(180)
    east!: number;
}
