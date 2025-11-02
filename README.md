# 🛫 Airport Info Agent

An AI-powered **Mastra Agent** that provides accurate and concise information about airports worldwide — including location, codes, timezone, and coordinates — in a friendly format for travelers and aviation enthusiasts.

---

## 🚀 Overview

This project is part of the **Telex AI Coworker** series.  
It demonstrates how to build a specialized AI agent using **Mastra**, with tool integration, persistent memory, and structured responses.

---

## 🧠 Features

- ✈️ Get airport info by **name, city, IATA, or ICAO code**  
- 📍 Provides **location, timezone, and coordinates**  
- 🧭 Traveler-friendly summaries  
- 💾 Persistent memory using **LibSQL**  
- 🧩 Built with **Mastra AI framework**

---

## Example Request

```bash
curl -X POST https://most-faint-yacht.mastra.cloud/a2a/agent/airportAgent \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": "test-001",
    "method": "message/send",
    "params": {
      "message": {
        "kind": "message",
        "role": "user",
        "parts": [
          {
            "kind": "text",
            "text": "Airport in Ikeja, Lagos"
          }
        ],
        "messageId": "msg-001",
        "taskId": "task-001"
      },
      "configuration": {
        "blocking": true
      }
    }
  }'


```

