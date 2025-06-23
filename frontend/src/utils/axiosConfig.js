import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:5000/api",
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error("❌ Error 401: Token inválido o expirado.");
      console.log("Token:", localStorage.getItem("token"));
      console.log("Usuario:", localStorage.getItem("usuario"));
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
