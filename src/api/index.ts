import axios from "axios";

const api = axios.create({
  baseURL: "http://193.151.143.46:7701/v1",
});

export default api;
