# 📊 DerivativeEdge – Full-Stack Crypto Derivatives Trading Platform (Testnet-Based)

## 🧩 Major Components Overview

This project is organized into four key components. Each component includes both a frontend interface and its corresponding backend logic, together forming a cohesive full-stack trading platform.

---

## 🔹 Component 1: Real-Time Order Book & Market Data Viewer

**Frontend:**
- Live bid/ask display with order book visualization
- Depth charts and market heatmaps
- WebSocket-based real-time updates

**Backend:**
- C++ module connects to exchange testnet WebSocket for market feed
- FastAPI (Python) bridges data to frontend via Redis pub/sub or direct WebSocket
- Optional REST endpoint for historical data snapshots

---

## 🔹 Component 2: Order Management System (Place/Modify/Cancel Orders)

**Frontend:**
- Interactive order entry panel for limit/market orders
- Table to display active and historical orders
- Modify/cancel actions with user prompts

**Backend:**
- RESTful API (FastAPI/Flask) for order placement, updates, and cancellation
- Core C++ engine communicates with exchange API for execution
- Live order status updates pushed via WebSocket or Redis stream

---

## 🔹 Component 3: Position & PnL Monitoring Dashboard

**Frontend:**
- Real-time portfolio and margin status view
- Live unrealized PnL tracking
- Summarized position breakdowns

**Backend:**
- C++ engine calculates real-time positions and PnL from trade data
- API exposes position state for UI initialization
- Redis/WebSocket stream updates to keep dashboard in sync

---

## 🔹 Component 4: Historical Trade Visualization & Strategy Testing

**Frontend:**
- Interactive charts of past trades and price movement
- Upload/run trading strategies from a user-friendly interface
- Toggle for switching between manual and algorithmic modes

**Backend:**
- C++ module supports plug-and-play strategy templates
- REST API to load strategies and fetch backtest results
- Secure sandboxing of user strategies in testnet environment

---

## 🚀 Tech Stack Highlights

- **Frontend:** React.js, Tailwind CSS, WebSockets, TradingView / Chart.js
- **Backend Core:** C++17, cURL, Boost.Asio, OpenSSL
- **API Layer:** FastAPI / Flask, Redis, JWT/OAuth2
- **Infrastructure:** Docker, NGINX, PostgreSQL / MongoDB, GitHub Actions

---

## ⚙️ Deployment

All components are containerized and designed for modular deployment. You can run them individually or as a full suite depending on your development or testing needs.

---

## 📌 Note

This project is built to interact with **generic crypto derivatives testnets**, not limited to Deribit. Exchange configuration is abstracted and easily extendable.

