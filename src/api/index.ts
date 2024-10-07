import axios from "axios";

const api = axios.create({
  baseURL: "https://api.pbudget.ir/v1",
});

export default api;
