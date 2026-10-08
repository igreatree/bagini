import {
    BadGatewayException,
    Injectable,
    InternalServerErrorException,
    Logger,
} from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import {
    OzonNotification,
    signCreateOrder,
    signOrderLookup,
    verifyNotification,
} from "./ozon-signature";

const DEFAULT_API_URL = "https://payapi.ozon.ru";
const CURRENCY_RUB = "643";
const PAYMENT_ALGORITHM = "PAY_ALGO_SMS";

// Единицы amount.value в документации (в рублях или в копейках) нужно
// сверить в тестовом режиме токена: на странице оплаты должна быть
// правильная сумма.
const toOzonAmount = (rubles: number) => String(rubles);

// Название поля со ссылкой на оплату в ответе createOrder не подтверждено
// документацией, поэтому перебираем известные варианты.
const PAYMENT_URL_KEYS = ["payLink", "paymentLink", "paymentUrl"];

type OzonConfig = {
    accessKey: string;
    secretKey: string;
    notificationSecretKey: string;
    apiUrl: string;
};

@Injectable()
export class OzonService {
    private readonly logger = new Logger(OzonService.name);

    constructor(private httpService: HttpService) {}

    private get config(): OzonConfig {
        const accessKey = process.env.OZON_PAY_ACCESS_KEY;
        const secretKey = process.env.OZON_PAY_SECRET_KEY;
        const notificationSecretKey =
            process.env.OZON_PAY_NOTIFICATION_SECRET_KEY;
        if (!accessKey || !secretKey || !notificationSecretKey) {
            throw new InternalServerErrorException(
                "Эквайринг Ozon не настроен",
            );
        }
        return {
            accessKey,
            secretKey,
            notificationSecretKey,
            apiUrl: process.env.OZON_PAY_API_URL || DEFAULT_API_URL,
        };
    }

    private async post(path: string, body: object) {
        try {
            const response = await firstValueFrom(
                this.httpService.post(`${this.config.apiUrl}${path}`, body, {
                    timeout: 10_000,
                }),
            );
            return response.data;
        } catch (error: any) {
            this.logger.error(
                `Ozon ${path} failed: ${error?.message} ${JSON.stringify(error?.response?.data)}`,
            );
            throw new BadGatewayException("Ошибка платёжного сервиса");
        }
    }

    async createOrder(order: {
        id: number;
        extId: string;
        total: number;
        receiptEmail?: string | null;
    }): Promise<{ ozonOrderId: string; paymentUrl: string }> {
        const { accessKey, secretKey } = this.config;
        const frontendUrl = (process.env.FRONTEND_URL ?? "").replace(/\/$/, "");
        const amount = {
            currencyCode: CURRENCY_RUB,
            value: toOzonAmount(order.total),
        };

        const data = await this.post("/v1/createOrder", {
            accessKey,
            extId: order.extId,
            paymentAlgorithm: PAYMENT_ALGORITHM,
            mode: "MODE_SHORTENED",
            amount,
            successUrl: `${frontendUrl}/order/${order.id}`,
            failUrl: `${frontendUrl}/order/${order.id}`,
            receiptEmail: order.receiptEmail || undefined,
            requestSign: signCreateOrder({
                accessKey,
                extId: order.extId,
                paymentAlgorithm: PAYMENT_ALGORITHM,
                currencyCode: amount.currencyCode,
                amount: amount.value,
                secretKey,
            }),
        });

        const ozonOrder = data?.order;
        const paymentUrl = PAYMENT_URL_KEYS.map((key) => ozonOrder?.[key]).find(
            (value) => typeof value === "string" && value,
        );
        if (!ozonOrder?.id || !paymentUrl) {
            this.logger.error(
                `Ozon createOrder: unexpected response ${JSON.stringify(data)}`,
            );
            throw new BadGatewayException("Ошибка платёжного сервиса");
        }

        return { ozonOrderId: String(ozonOrder.id), paymentUrl };
    }

    // Возвращает статус заказа на стороне Ozon, например STATUS_PAID
    async getOrderStatus(order: {
        ozonOrderId: string;
        extId: string;
    }): Promise<string | null> {
        const { accessKey, secretKey } = this.config;
        const data = await this.post("/v1/getOrderStatus", {
            accessKey,
            id: order.ozonOrderId,
            extId: order.extId,
            requestSign: signOrderLookup({
                id: order.ozonOrderId,
                extId: order.extId,
                accessKey,
                secretKey,
            }),
        });

        const status = data?.order?.status ?? data?.status;
        if (typeof status !== "string") {
            this.logger.error(
                `Ozon getOrderStatus: unexpected response ${JSON.stringify(data)}`,
            );
            return null;
        }
        return status;
    }

    verifyNotification(notification: OzonNotification) {
        const { accessKey, notificationSecretKey } = this.config;
        return verifyNotification(
            notification,
            accessKey,
            notificationSecretKey,
        );
    }
}
