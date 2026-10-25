import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { CatalogService } from "./catalog.service";
import { CatalogController } from "./catalog.controller";
import { SheetModule } from "../sheet/sheet.module";

@Module({
    imports: [HttpModule, SheetModule],
    controllers: [CatalogController],
    providers: [CatalogService],
    exports: [CatalogService],
})
export class CatalogModule {}
