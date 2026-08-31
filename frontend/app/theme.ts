import { createTheme } from "@mantine/core";

export const theme = createTheme({
    primaryColor: "pink",

    primaryShade: {
        light: 6,
        dark: 5,
    },

    components: {
        Button: {
            defaultProps: {
                color: "pink",
            },
        },

        Tabs: {
            defaultProps: {
                color: "pink",
            },
        },

        Select: {
            defaultProps: {
                variant: "default",
            },
        },
    },
});
