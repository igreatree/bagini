import {
    BadGatewayException,
    Injectable,
    InternalServerErrorException,
    Logger,
} from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";

const DEFAULT_API_URL = "https://api-delivery.ozon.ru";
const DEFAULT_TOKEN_URL = "https://xapi.ozon.ru/oauth/token";
const TOKEN_SCOPE = ["delivery-api.all"];
// Токен обновляем заранее, чтобы запрос не ушёл с истёкшим
const TOKEN_MARGIN_SECONDS = 60;
// Срок жизни, если Ozon не вернул expires_in
const DEFAULT_TOKEN_TTL_SECONDS = 5 * 60;
// Ozon может перенаправить запрос (302/307) на тот же адрес; больше — это уже ошибка
const MAX_REDIRECTS = 3;
const CURRENCY_RUB = "RUB";

// Габариты и оценочная стоимость посылки с пробником. Нулевую оценочную
// стоимость Ozon не принимает, поэтому по умолчанию 1 ₽.
const PARCEL_DEFAULTS = {
    weightG: 100,
    lengthMm: 150,
    widthMm: 100,
    heightMm: 50,
    declaredValue: 1,
};

export type OzonDeliveryPoint = {
    id: number;
    shipmentMethodIds: number[];
};

export type OzonDeliveryPointInfo = {
    id: number;
    name: string;
    address: string;
    type: string | null;
    latitude: number | null;
    longitude: number | null;
    isActive: boolean;
};

type OzonDeliveryConfig = {
    clientId: string;
    clientSecret: string;
    apiUrl: string;
    tokenUrl: string;
};

const intFromEnv = (name: string, fallback: number) => {
    const value = Number(process.env[name]);
    return Number.isInteger(value) && value > 0 ? value : fallback;
};

const toNumberOrNull = (value: unknown) => {
    const number = Number(value);
    return value === null || value === undefined || !Number.isFinite(number)
        ? null
        : number;
};

// Телефон в аккаунте хранится цифрами (79001234567), Ozon ждёт +79001234567
const toOzonPhone = (phone: string) => `+${phone.replace(/\D/g, "")}`;

// Ошибка без ответа от Ozon (сеть, таймаут) или 5xx: заказ мог создаться, повтор с тем же
// Idempotency-Key безопасен. Ответ 4xx — Ozon заказ не принял, повторять нечего.
const isAmbiguous = (error: any) => {
    const status = error?.response?.status;
    return status === undefined || status >= 500;
};

@Injectable()
export class OzonDeliveryService {
    private readonly logger = new Logger(OzonDeliveryService.name);
    private token: { value: string; expiresAt: number } | null = null;
    private tokenRequest: Promise<string> | null = null;

    constructor(private httpService: HttpService) {}

    private get optionalConfig(): OzonDeliveryConfig | null {
        const clientId = process.env.OZON_DELIVERY_CLIENT_ID;
        const clientSecret = process.env.OZON_DELIVERY_CLIENT_SECRET;
        if (!clientId || !clientSecret) return null;
        return {
            clientId,
            clientSecret,
            apiUrl: (
                process.env.OZON_DELIVERY_API_URL || DEFAULT_API_URL
            ).replace(/\/$/, ""),
            tokenUrl: process.env.OZON_DELIVERY_TOKEN_URL || DEFAULT_TOKEN_URL,
        };
    }

    private get config(): OzonDeliveryConfig {
        const config = this.optionalConfig;
        if (!config) {
            throw new InternalServerErrorException(
                "Доставка Ozon не настроена",
            );
        }
        return config;
    }

    get isConfigured() {
        return !!this.optionalConfig && this.shipmentMethodId !== null;
    }

    // Способ отгрузки заводится в личном кабинете Ozon Доставки
    get shipmentMethodId(): number | null {
        return intFromEnv("OZON_DELIVERY_SHIPMENT_METHOD_ID", 0) || null;
    }

    private get posting() {
        const shipmentMethodId = this.shipmentMethodId;
        if (shipmentMethodId === null) {
            throw new InternalServerErrorException(
                "Доставка Ozon не настроена",
            );
        }
        return {
            request_id: 1,
            shipment_method_id: shipmentMethodId,
            cutoff_at: null,
            declared_value: {
                amount: String(
                    intFromEnv(
                        "PROBE_DECLARED_VALUE",
                        PARCEL_DEFAULTS.declaredValue,
                    ),
                ),
                currency_code: CURRENCY_RUB,
            },
            dimensions: {
                weight_g: intFromEnv("PROBE_WEIGHT_G", PARCEL_DEFAULTS.weightG),
                length_mm: intFromEnv(
                    "PROBE_LENGTH_MM",
                    PARCEL_DEFAULTS.lengthMm,
                ),
                width_mm: intFromEnv("PROBE_WIDTH_MM", PARCEL_DEFAULTS.widthMm),
                height_mm: intFromEnv(
                    "PROBE_HEIGHT_MM",
                    PARCEL_DEFAULTS.heightMm,
                ),
            },
        };
    }

    private async fetchToken() {
        const { clientId, clientSecret, tokenUrl } = this.config;
        try {
            const response = await firstValueFrom(
                this.httpService.post(
                    tokenUrl,
                    {
                        client_id: clientId,
                        client_secret: clientSecret,
                        grant_type: "client_credentials",
                        scope: TOKEN_SCOPE,
                    },
                    { timeout: 10_000 },
                ),
            );
            const value = response.data?.access_token;
            if (typeof value !== "string" || !value) {
                throw new Error("no access_token in response");
            }
            // По описанию клиента Ozon expires_in — момент окончания (Unix-время), а не
            // длительность; поддерживаем оба варианта.
            const expiresIn = Number(response.data?.expires_in);
            const now = Date.now() / 1000;
            const expiresAt =
                Number.isFinite(expiresIn) && expiresIn > 0
                    ? expiresIn > 1e9
                        ? expiresIn
                        : now + expiresIn
                    : now + DEFAULT_TOKEN_TTL_SECONDS;
            this.token = { value, expiresAt };
            return value;
        } catch (error: any) {
            this.logger.error(
                `Ozon Delivery token failed: ${error?.message} ${JSON.stringify(error?.response?.data)}`,
            );
            throw new BadGatewayException("Ошибка сервиса доставки");
        }
    }

    // Параллельные запросы делят одно получение токена
    private async getToken() {
        if (
            this.token &&
            this.token.expiresAt - Date.now() / 1000 > TOKEN_MARGIN_SECONDS
        ) {
            return this.token.value;
        }
        this.tokenRequest ??= this.fetchToken().finally(() => {
            this.tokenRequest = null;
        });
        return this.tokenRequest;
    }

    private async send(
        path: string,
        body: object,
        headers: Record<string, string>,
    ) {
        const origin = new URL(this.config.apiUrl).origin;
        let url = `${this.config.apiUrl}${path}`;
        for (let redirects = 0; ; redirects++) {
            const response = await firstValueFrom(
                this.httpService.post(url, body, {
                    headers: {
                        ...headers,
                        Authorization: `Bearer ${await this.getToken()}`,
                    },
                    timeout: 15_000,
                    maxRedirects: 0,
                    validateStatus: (status) => status < 400,
                }),
            );
            if (response.status < 300) return response.data;

            const location = response.headers?.location;
            const target = location ? new URL(location, url) : null;
            if (
                ![302, 307].includes(response.status) ||
                !target ||
                target.origin !== origin ||
                redirects >= MAX_REDIRECTS
            ) {
                throw new Error(`unexpected redirect ${response.status}`);
            }
            url = target.toString();
        }
    }

    // idempotencyKey включает один повтор при неопределённой ошибке: заказ мог
    // создаться, а повторный запрос с тем же ключом вернёт тот же результат
    private async post(
        path: string,
        body: object,
        options: { idempotencyKey?: string } = {},
    ) {
        const headers: Record<string, string> = options.idempotencyKey
            ? { "Idempotency-Key": options.idempotencyKey }
            : {};
        let retries = options.idempotencyKey ? 1 : 0;
        let reauthorized = false;
        for (;;) {
            try {
                return await this.send(path, body, headers);
            } catch (error: any) {
                // Токен мог истечь раньше срока: запрос отклонён, повтор с новым токеном безопасен
                if (error?.response?.status === 401 && !reauthorized) {
                    reauthorized = true;
                    this.token = null;
                    continue;
                }
                if (retries > 0 && isAmbiguous(error)) {
                    retries--;
                    continue;
                }
                if (error instanceof InternalServerErrorException) throw error;
                this.logger.error(
                    `Ozon Delivery ${path} failed: ${error?.message} ${JSON.stringify(error?.response?.data)}`,
                );
                throw new BadGatewayException("Ошибка сервиса доставки");
            }
        }
    }

    // Получателю на Ozon можно доставить, только если его номер зарегистрирован в Ozon
    async canDeliverTo(phone: string): Promise<boolean> {
        const data = await this.post("/v1/delivery/check-client", {
            phone_number: toOzonPhone(phone),
        });
        return data?.can_be_delivered === true;
    }

    // Справочник пунктов выдачи отдаётся страницами по курсору. Первая страница — cursor: null.
    async listPoints(
        cursor: string | null,
        limit = 100,
    ): Promise<{ points: OzonDeliveryPoint[]; nextCursor: string | null }> {
        const data = await this.post("/v1/delivery-point/list", {
            pagination: { cursor, limit },
        });
        return {
            points: (data?.delivery_points ?? []).map((point: any) => ({
                id: Number(point.delivery_point_id),
                shipmentMethodIds: (point.shipment_method_ids ?? []).map(
                    Number,
                ),
            })),
            nextCursor: data?.next_cursor || null,
        };
    }

    async getPoints(ids: number[]): Promise<OzonDeliveryPointInfo[]> {
        if (ids.length === 0) return [];
        const data = await this.post("/v1/delivery-point/info", {
            delivery_point_ids: ids,
        });
        return (data?.delivery_points ?? []).map((point: any) => ({
            id: Number(point.delivery_point_id),
            name: String(point.name ?? ""),
            address: String(point.full_address ?? ""),
            type: point.type === undefined ? null : String(point.type),
            latitude: toNumberOrNull(point.coordinates?.latitude),
            longitude: toNumberOrNull(point.coordinates?.longitude),
            isActive: point.is_active !== false,
        }));
    }

    // Пункт может временно не принимать посылки, поэтому перед заказом проверяем его
    async isPointAvailable(pointId: number): Promise<boolean> {
        const { shipment_method_id, ...posting } = this.posting;
        const data = await this.post("/v1/delivery-point/check-availability", {
            delivery_point_ids: [pointId],
            shipment_method_id,
            postings: [posting],
        });
        const result = (data?.results ?? [])[0];
        if (!result || result.error) {
            this.logger.warn(
                `Ozon Delivery point ${pointId} unavailable: ${JSON.stringify(result?.error)}`,
            );
            return false;
        }
        return true;
    }

    // extId заказа — UUID, он же Idempotency-Key: повторный запрос не создаст второй заказ
    async createOrder(order: {
        id: number;
        extId: string;
        phone: string;
        recipientName?: string;
        deliveryPointId: number;
        description: string;
    }): Promise<{ orderNumber: string }> {
        const data = await this.post(
            "/v1/order/create",
            {
                order_external_id: String(order.id),
                recipient: {
                    phone_number: toOzonPhone(order.phone),
                    ...(order.recipientName
                        ? { full_name: order.recipientName }
                        : {}),
                },
                delivery: {
                    delivery_point: {
                        delivery_point_id: order.deliveryPointId,
                    },
                },
                postings: [
                    {
                        ...this.posting,
                        posting_external_id: String(order.id),
                        description: order.description.slice(0, 500),
                    },
                ],
            },
            { idempotencyKey: order.extId },
        );

        const orderNumber = data?.order_number;
        if (typeof orderNumber !== "string" || !orderNumber) {
            this.logger.error(
                `Ozon Delivery order/create (${order.extId}): unexpected response ${JSON.stringify(data)}`,
            );
            throw new BadGatewayException("Ошибка сервиса доставки");
        }
        return { orderNumber };
    }
}
