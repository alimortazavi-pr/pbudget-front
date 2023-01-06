import axios from "axios";

const api = axios.create({
  baseURL: "http://api.pbudget.alimortazavi.org/v1",
});

export default api;
