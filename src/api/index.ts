import axios from "axios";

const api = axios.create({
  baseURL: "https://pbudget-back.cyclic.app/v1",
});

export default api;
