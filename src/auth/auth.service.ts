import api from "../api/api";

interface LoginResponse {
  access: string;
  refresh: string;
}

export const register = async (body: {
  email: string;
  username: string;
  password: string;
  password2: string;
}) => {
  const res = await api.post("/auth/register/", body);
  return res.data;
};

export const loginRequest = async (body: { email: string; password: string }) => {
  const res = await api.post<LoginResponse>("/auth/login/", body);
  return res.data; 
};

export const refreshTokenRequest = async (refresh: string) => {
  const res = await api.post<{ access: string }>("/auth/refresh/", { refresh });
  return res.data; 
};
