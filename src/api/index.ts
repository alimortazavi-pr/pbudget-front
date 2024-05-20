import axios from "axios";

const api = axios.create({
  baseURL: "https://pb-back.pourhomestore.top/v1",
});

export default api;
