import { createMultiStyleConfigHelpers } from "@chakra-ui/react";
import { modalAnatomy } from "@chakra-ui/anatomy";

const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(modalAnatomy.keys);

const baseStyle = definePartsStyle({
  dialog: {
    bg: "#1f2937",
  },
});

export const modalTheme = defineMultiStyleConfig({ baseStyle });
