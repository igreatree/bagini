import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { SheetService } from "./sheet.service";

@Module({
    imports: [HttpModule],
    providers: [SheetService],
    exports: [SheetService],
})
export class SheetModule {}
