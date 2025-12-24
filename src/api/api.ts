import axios from "axios";

const api = axios.create({
  baseURL: "http://167.172.237.177:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");

    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export const getDataSources = async () => {
  try {
    const res = await api.get("/data-sources/");
    const data = res.data;
    return Array.isArray(data) ? data : data?.results ?? [];
  } catch (error: any) {
    console.error("Error fetching data sources:", error.response?.data || error.message);
    throw error;
  }
};

export const analyzeTool = async (body: {
  name: string;
  intent: string;
  data_source_id: number;
  ai_model?: string;
}) => {
  try {
    const res = await api.post("/ai-tools/analyze/", body);
    return res.data;
  } catch (error: any) {
    console.error("Error analyzing tool:", error.response?.data || error.message);
    throw error;
  }
};

export const configureTool = async (
  toolId: number,
  body: {
    selected_approach: string;
    model_type: string;
    target_column: string;
    feature_columns: { name: string; type: string }[];
    algorithm: string;
    hyperparameters: Record<string, any>;
    train_test_split?: number;
    random_state?: number;
  }
) => {
  try {
    const res = await api.post(`/ai-tools/${toolId}/configure/`, body);
    return res.data;
  } catch (error: any) {
    console.error("Error configuring tool:", error.response?.data || error.message);
    throw error;
  }
};

export const generateCode = async (toolId: number) => {
  try {
    const res = await api.post(`/ai-tools/${toolId}/generate_code/`);
    return res.data;
  } catch (error: any) {
    console.error("Error generating code:", error.response?.data || error.message);
    throw error;
  }
};

export const trainModel = async (toolId: number) => {
  try {
    const res = await api.post(`/ai-tools/${toolId}/train/`);
    return res.data;
  } catch (error: any) {
    console.error("Error training model:", error.response?.data || error.message);
    throw error;
  }
};

export default api;
