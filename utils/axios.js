import axios from "axios";

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL
});

// Automatically attach token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("grocery_admin_token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// Handle expired or invalid token
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("grocery_admin_token");
            console.log("session expired", error);
            // window.location.href = "/admin/login";
            toast.error("Session expired. Please login again.");
        }

        return Promise.reject(error);
    }
);

export default api;