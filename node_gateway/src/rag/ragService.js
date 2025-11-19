const axios = require("axios");
require("dotenv").config();

const RAG_BASE_URL = process.env.RAG_BASE_URL;

async function notifyDisconnect() {
  try {
    await axios.post(`${RAG_BASE_URL}/callLLM?status=off`, { query :" " });
  } catch (err) {
    console.error("Failed to notify RAG:", err.message);
  }
}

async function forwardMessageToRAG(query) {
  try {
    const res = await axios.post(`${RAG_BASE_URL}/callLLM?status=on`, { query });
    return res.data;
  } catch (err) {
    console.error("RAG message error:", err.message);
    return { error: "RAG failed" };
  }
}

module.exports = {
  notifyDisconnect,
  forwardMessageToRAG,
};
