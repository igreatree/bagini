import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { CatalogService } from "./catalog.service";
import { CatalogController } from "./catalog.controller";

@Module({
    imports: [HttpModule],
    controllers: [CatalogController],
    providers: [CatalogService],
    exports: [CatalogService],
})
export class CatalogModule {}
