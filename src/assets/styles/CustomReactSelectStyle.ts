import { GroupBase, StylesConfig } from "react-select";

const customStyle: StylesConfig<any, boolean, GroupBase<any>> = {
  control: (provided, state) => ({
    ...provided,
    minHeight: "var(--chakra-sizes-10)",
    borderRadius: "0.375rem",
    borderColor: state.isFocused ? "#F56565" : "",
    boxShadow: state.isFocused ? "0 0 0 1px #F56565" : "",
    ":hover": {
      borderColor: "#F56565",
    },
  }),
  placeholder: (provided, state) => ({
    ...provided,
    fontWeight: "400",
    color: "#7d7d7d",
    fontSize: "15px",
    "@media only screen and (max-width: 1023px)": {
      fontSize: "14px",
    },
  }),
  option: (provided, state) => ({
    ...provided,
    zIndex: 4,
    backgroundColor: state.isSelected ? "#fda4af" : "",
    color: state.isSelected ? "black" : "",
  }),
  container: (provided, state) => ({
    ...provided,
  }),
  menu: (provided, state) => ({
    ...provided,
    zIndex: 5,
  }),
  menuList: (provided, state) => ({
    ...provided,
    zIndex: 10,
  }),
};

export default customStyle;
