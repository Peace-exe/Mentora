import axios from "axios";
require("dotenv").config();

const RAG_BASE_URL = process.env.RAG_BASE_URL; 

export async function notifyStatus(status) {
  try {
    await axios.post(`${RAG_BASE_URL}/status`, { status });
  } catch (err) {
    console.error("Failed to notify RAG:", err.message);
  }
}

export async function forwardMessageToRAG(message) {
  try {
    const res = await axios.post(`${RAG_BASE_URL}/message`, { message });
    return res.data; // RAG response
  } catch (err) {
    console.error("RAG message error:", err.message);
    return { error: "RAG failed" };
  }
}
