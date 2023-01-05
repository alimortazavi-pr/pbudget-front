import { extendTheme } from "@chakra-ui/react";
import { Dict } from "@chakra-ui/utils";

const extendChakraTheme: Dict = extendTheme({
  direction: "rtl",
  config: {
    initialColorMode: "dark",
    useSystemColorMode: false,
  },
  components: {
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

export default extendChakraTheme;
