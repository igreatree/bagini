// Только чтение заказа и /v1/order/checkout: не создаёт отправлений и резервов.
const { Logger } = require("@nestjs/common");
const { HttpService } = require("@nestjs/axios");
const { PrismaService } = require("../dist/src/prisma.service");
const {
    OzonDeliveryService,
} = require("../dist/src/delivery/ozon-delivery.service");

const orderId = Number(process.argv[2]);
if (!Number.isSafeInteger(orderId) || orderId <= 0) {
    console.error(
        "Укажите номер заказа: node scripts/diagnose-ozon-delivery.cjs 53",
    );
    process.exit(1);
}

// Не выводим необработанные ответы сервиса, в которых Ozon может повторить телефон.
Logger.overrideLogger(false);
const safe = (value) => JSON.stringify(value).replace(/\+?7\d{10}/g, "[phone]");
const watchdog = setTimeout(() => {
    console.error(
        "Диагностика прервана по таймауту. Проверьте доступ к PostgreSQL и Ozon.",
    );
    process.exit(1);
}, 60_000);
watchdog.unref();

async function main() {
    const db = new PrismaService();
    let order;
    try {
        order = await db.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                status: true,
                deliveryPointId: true,
                ozonDeliveryRequest: true,
                user: { select: { phone: true } },
            },
        });
    } finally {
        await db.$disconnect();
    }
    if (!order?.deliveryPointId) throw Error("Заказ с выбранным ПВЗ не найден");
    const phone = order.ozonDeliveryRequest?.phone ?? order.user.phone;
    const http = new HttpService();
    let lastFailure;
    http.axiosRef.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.config?.url?.includes("/v1/order/checkout")) {
                lastFailure = {
                    status: error.response?.status,
                    traceId: error.response?.headers?.["x-o3-trace-id"],
                    response: error.response?.data,
                };
            }
            return Promise.reject(error);
        },
    );
    const api = new OzonDeliveryService(http);
    console.log(
        safe({
            orderId,
            status: order.status,
            pointId: Number(order.deliveryPointId),
        }),
    );
    for (const variant of [
        "current",
        "value-1",
        "value-100",
        "future-cutoff",
    ]) {
        lastFailure = undefined;
        const posting = { ...api.posting };
        if (variant === "value-1")
            posting.declared_value = { amount: "1", currency_code: "RUB" };
        if (variant === "value-100")
            posting.declared_value = { amount: "100", currency_code: "RUB" };
        if (variant === "future-cutoff")
            posting.cutoff_at = new Date(Date.now() + 86_400_000).toISOString();
        try {
            // Используем тот же OAuth и обработку testcookie, что и основной сервис.
            const result = await api.post("/v1/order/checkout", {
                recipient: { phone_number: `+${phone.replace(/\D/g, "")}` },
                delivery: {
                    delivery_point: {
                        delivery_point_id: Number(order.deliveryPointId),
                    },
                },
                postings: [posting],
            });
            console.log(safe({ variant, result }));
        } catch (error) {
            console.log(
                safe({
                    variant,
                    ...(lastFailure ?? {
                        error: error.getResponse?.() ?? "Ошибка расчёта",
                    }),
                }),
            );
        }
    }
}

main()
    .catch(() => {
        console.error(
            "Не удалось выполнить диагностику. Проверьте номер заказа, окружение и доступ к базе.",
        );
        process.exitCode = 1;
    })
    .finally(() => clearTimeout(watchdog));
