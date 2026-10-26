import { createTheme } from "@mantine/core";

export const theme = createTheme({
    primaryColor: "blue",

    primaryShade: {
        light: 6,
        dark: 5,
    },

    components: {
        Button: {
            defaultProps: {
                color: "blue",
            },
        },

        Tabs: {
            defaultProps: {
                color: "blue",
            },
        },

        Select: {
            defaultProps: {
                variant: "default",
            },
        },
    },
});
