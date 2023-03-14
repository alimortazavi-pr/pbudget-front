import axios from "axios";

const api = axios.create({
  baseURL: "https://api-budget.paradisecode.org/v1",
});

export default api;
