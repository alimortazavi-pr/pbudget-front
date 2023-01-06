import axios from "axios";

const api = axios.create({
  baseURL: "https://api-pbudget.alimortazavi.org/v1",
});

export default api;
