import axios from 'axios';

const API_URL = 'http://127.0.0.1:5000';

export const signup = async (username, email, password) => {
    const response = await axios.post(`${API_URL}/signup`, { username, email, password });
    return response.data;
};

export const login = async (email, password) => {
    const response = await axios.post(`${API_URL}/login`, { email, password });
    return response.data;
};

export const logout = async () => {
    const response = await axios.post(`${API_URL}/logout`);
    return response.data;
};

export const checkAuthStatus = async () => {
    const response = await axios.get(`${API_URL}/auth-status`);
    return response.data;
};