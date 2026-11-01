import { IsOptional, IsString, MaxLength } from "class-validator";

export class SearchPointsDto {
    @IsOptional()
    @IsString()
    @MaxLength(100)
    q?: string;
}
