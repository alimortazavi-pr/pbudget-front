import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:7701/v1",
});

export default api;
