import {
    notificationSignature,
    signCreateOrder,
    verifyNotification,
} from "./ozon-signature";

// Значения из документации Ozon Acquiring API
describe("ozon signature", () => {
    it("signs createOrder request", () => {
        expect(
            signCreateOrder({
                accessKey: "63fd43a4-f16d-4c3a-9bdf-50f2328781db",
                expiresAt: "2025-10-01T20:00:00.000Z",
                extId: "MyOrderID-1",
                fiscalizationType: "FISCAL_TYPE_SINGLE",
                paymentAlgorithm: "PAY_ALGO_SMS",
                currencyCode: "643",
                amount: "100",
                secretKey: "PnHtbKc0lLiTlo4WITnWB44Qb1kpygRl",
            }),
        ).toBe(
            "406d29c45ffcb991eb40c3fbce98e714c1ed8963fee0024d7c3ba80dabc407bd",
        );
    });

    const accessKey = "1fac5a70-0ec4-4963-a33a-040ea301ea85";
    const secret = "4qEzUJjBoCXwA6P5NMyrJJUdA6xsnvbV";
    const notification = {
        orderID: "69f37767-8a8b-4de1-a601-384387aea8c4",
        extOrderID: "",
        transactionID: 6981437,
        amount: 52569,
        currencyCode: "643",
    };
    const requestSign =
        "ae3c635dd72ec6b2c7833aa7458d57827895a57d4c35fba0e7dcb48f1d367d5f";

    it("computes notification signature", () => {
        expect(notificationSignature(notification, accessKey, secret)).toBe(
            requestSign,
        );
    });

    it("verifies notification signature", () => {
        expect(
            verifyNotification(
                { ...notification, requestSign },
                accessKey,
                secret,
            ),
        ).toBe(true);
        expect(
            verifyNotification(
                { ...notification, amount: 1, requestSign },
                accessKey,
                secret,
            ),
        ).toBe(false);
        expect(verifyNotification(notification, accessKey, secret)).toBe(false);
    });
});
