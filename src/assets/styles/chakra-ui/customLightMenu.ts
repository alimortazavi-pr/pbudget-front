import { menuAnatomy } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers } from "@chakra-ui/react";

const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(menuAnatomy.keys);

const baseStyle = definePartsStyle({
  button: {},
  list: {
    minW: "0",
    maxW: "max-content",
    alignItems: "start",
    display: "flex",
    flexDirection: "column",
    px: "0.5rem",
  },
  item: {},
  groupTitle: {},
  command: {},
  divider: {},
});

export const menuTheme = defineMultiStyleConfig({ baseStyle });
