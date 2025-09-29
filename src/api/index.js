// src/api/index.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4000/api/product', // Your backend API base URL
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;