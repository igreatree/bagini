import { createHash, timingSafeEqual } from "crypto";

const sha256Hex = (value: string) =>
    createHash("sha256").update(value, "utf8").digest("hex");

// Порядок полей в подписи фиксирован документацией Ozon Acquiring API,
// пустые необязательные поля подставляются пустой строкой.
export const signCreateOrder = (p: {
    accessKey: string;
    expiresAt?: string;
    extId: string;
    fiscalizationType?: string;
    paymentAlgorithm: string;
    currencyCode: string;
    amount: string;
    secretKey: string;
}) =>
    sha256Hex(
        [
            p.accessKey,
            p.expiresAt ?? "",
            p.extId,
            p.fiscalizationType ?? "",
            p.paymentAlgorithm,
            p.currencyCode,
            p.amount,
            p.secretKey,
        ].join(""),
    );

// Подпись для getOrderStatus, getOrderDetails: id + extId + accessKey + secretKey
export const signOrderLookup = (p: {
    id?: string;
    extId?: string;
    accessKey: string;
    secretKey: string;
}) => sha256Hex([p.id ?? "", p.extId ?? "", p.accessKey, p.secretKey].join(""));

export type OzonNotification = {
    orderID?: string | null;
    transactionID?: string | number | null;
    transactionUid?: string | null;
    extOrderID?: string | null;
    extTransactionID?: string | null;
    amount?: string | number | null;
    currencyCode?: string | number | null;
    requestSign?: string | null;
};

const str = (value: unknown) =>
    value === null || value === undefined ? "" : String(value);

// SHA256("{accessKey}|{orderID}|{transactionID}|{extOrderID}|{amount}|{currencyCode}|{notificationSecretKey}")
// Для самостоятельных оплат (без orderID) вместо extOrderID берётся extTransactionID.
export const notificationSignature = (
    n: OzonNotification,
    accessKey: string,
    notificationSecretKey: string,
) =>
    sha256Hex(
        [
            accessKey,
            str(n.orderID),
            str(n.transactionID ?? n.transactionUid),
            str(n.orderID ? n.extOrderID : n.extTransactionID),
            str(n.amount),
            str(n.currencyCode),
            notificationSecretKey,
        ].join("|"),
    );

export const verifyNotification = (
    n: OzonNotification,
    accessKey: string,
    notificationSecretKey: string,
) => {
    const expected = Buffer.from(
        notificationSignature(n, accessKey, notificationSecretKey),
    );
    const actual = Buffer.from(str(n.requestSign).toLowerCase());
    return (
        expected.length === actual.length && timingSafeEqual(expected, actual)
    );
};
