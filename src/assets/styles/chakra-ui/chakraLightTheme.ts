import { extendTheme } from "@chakra-ui/react";
import { Dict } from "@chakra-ui/utils";
import { menuTheme } from "./customLightMenu";

const chakraLightTheme: Dict = extendTheme({
  direction: "rtl",
  config: {
    initialColorMode: "light",
    useSystemColorMode: false,
  },
  colors: {
    rose: {
      50: "#fff1f2",
      100: "#ffe4e6",
      200: "#fecdd3",
      300: "#fda4af",
      400: "#fb7185",
      500: "#f43f5e",
      600: "#e11d48",
      700: "#be123c",
      800: "#881337",
      900: "#1a202c",
    },
  },
  components: {
    Menu: menuTheme,
    Form: {
      variants: {
        floating: {
          container: {
            _focusWithin: {
              label: {
                transform: "scale(0.85) translateY(-24px)",
              },
            },
            "input:not(:placeholder-shown) + label, .chakra-select__wrapper + label, textarea:not(:placeholder-shown) ~ label":
              {
                transform: "scale(0.85) translateY(-24px)",
              },
            label: {
              top: 0,
              right: 0,
              zIndex: 2,
              position: "absolute",
              backgroundColor: "white",
              pointerEvents: "none",
              mx: 3,
              px: 1,
              my: 2,
              transformOrigin: "right top",
            },
          },
        },
      },
    },
  },
});

export default chakraLightTheme;
