# 🚀 Greedi-Fi – Full-Stack Crypto Derivatives Trading Platform

## 📌 Project Description

**EdgeTrade** is a full-stack, high-performance crypto derivatives trading platform built in C++ and modern web technologies. It enables automated, manual, and algorithmic trading on **testnet environments**, offering institutional-grade functionality. The platform supports placing/modifying/canceling orders, real-time order book visualization, position monitoring, and trade analytics. Engineered with low-latency trading logic and robust API communication, it replicates real-world trading systems used by professional firms.

A sleek web frontend integrates with the backend to provide real-time UI for traders, with live updates powered by WebSockets and historical insights visualized via interactive charts. Built with scalability and modularity in mind, EdgeTrade is deployable as a standalone app or extendable to support multiple crypto derivatives exchanges.

---

## 🔧 Key Features

- ⚡ **High-Speed C++ Trading Engine**: Uses cURL and optimized concurrency to interact with crypto exchange APIs for low-latency order execution.
- 📈 **Real-Time Order Book & Market Data**: Live bid/ask updates using WebSockets with visual depth charts and heatmaps.
- 🛠 **Order Management System**: Submit, modify, cancel limit/market orders for different instruments with precise control.
- 📊 **Position & PnL Dashboard**: Monitor current holdings, unrealized PnL, and margin status via a user-friendly dashboard.
- 💡 **Strategy Module (Optional)**: Plug-and-play interface for deploying algorithmic strategies using predefined templates.
- 📉 **Historical Trade Visualization**: Graphs and analytics for understanding past trades and market behavior.
- 🧪 **Testnet Safe**: Fully operational on testnet environments for risk-free experimentation and algorithm testing.
- 🔐 **Secure Key Management**: Encrypted storage and handling of API keys with role-based access for different users.

---

## 🧰 Tech Stack

### Backend (Trading Engine & API Layer)

- **Language**: C++17
- **Libraries**:
  - cURL – HTTP client for API interaction
  - nlohmann/json – Lightweight JSON parsing
  - libwebsockets or Boost.Beast – WebSocket handling for real-time feeds
- **Multithreading**: std::thread / asio for concurrent API requests and live updates
- **Security**: OpenSSL for request signing (HMAC SHA256)

### Backend Wrapper / API Gateway

- **Framework**: FastAPI / Flask (Python)
- **Real-Time Communication**: Redis pub-sub
- **Authentication**: JWT / OAuth2

### Frontend (Trading Dashboard)

- **Framework**: React.js + Tailwind CSS
- **Charting Libraries**: recharts, react-chartjs-2, or TradingView Widget
- **WebSockets**: socket.io-client or native browser WebSocket
- **Responsive Design**: Optimized for both desktop and mobile

### DevOps & Infrastructure

- **Containerization**: Docker
- **Web Server**: NGINX + HTTPS
- **CI/CD**: GitHub Actions
- **Database**: PostgreSQL or MongoDB

---

## 🌟 Innovative Aspects

- **Low-Latency Engine in C++**: Brings institutional-grade performance to retail users.
- **Real-Time Web Integration**: Synchronized trading with live visual feedback.
- **Extendable Algorithmic Trading Framework**: Encourages users to develop and test their own strategies safely.
- **Crypto-Focused**: Tailored for the unique mechanics of crypto derivatives trading.
- **Open-Source Potential**: Can serve as a base for community-driven algo trading bots.

---

## ✅ Outcome / Impact

- Simulates a real-world trading desk with end-to-end capabilities.
- Valuable for learning high-frequency trading concepts, API integration, and full-stack development.
- Enables experimentation with algorithmic strategies using real market data in a safe test environment.
- Designed for potential deployment to production with exchange API key switch.
