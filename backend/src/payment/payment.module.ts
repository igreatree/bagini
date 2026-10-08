import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { OzonService } from "./ozon.service";

@Module({
    imports: [HttpModule],
    providers: [OzonService],
    exports: [OzonService],
})
export class PaymentModule {}
