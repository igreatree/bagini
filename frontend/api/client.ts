import axios from "axios";
import { notifications } from "@mantine/notifications";
import { processErrorMessage } from "../helpers";

const Api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_HOST,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

Api.interceptors.response.use(
    (response) => response,
    (error) => {
        notifications.show({
            title: "Ошибка",
            color: "red",
            message: processErrorMessage(error),
        });
    },
);

export default Api;
