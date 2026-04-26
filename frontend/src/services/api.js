const axios = require("axios");

const api = axios.create({
  baseURL: process.env.API_BASE_URL || "http://localhost:8000/api/v1",
  timeout: 10000,
});

module.exports = api;