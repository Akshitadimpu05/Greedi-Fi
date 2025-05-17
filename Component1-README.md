# Real-Time Order Book & Market Data Viewer - Component 1

This component provides real-time market data visualization for Greedi-Fi, including order book depth, recent trades, and market insights. It implements WebSocket-based real-time updates to ensure traders have access to the latest market information.

## Architecture

The implementation follows a layered architecture:

1. **C++ Market Data Feed**: Connects directly to exchange WebSocket APIs for high-performance data collection
2. **Redis Pub/Sub**: Acts as a message broker between the C++ component and the FastAPI service
3. **FastAPI Backend**: Provides both WebSocket and REST endpoints for frontend access
4. **React Frontend**: Renders real-time visualizations using recharts and WebSocket connections

## Features

- **Real-time Order Book**: Shows current bids and asks with price/quantity
- **Depth Chart**: Visual representation of market liquidity
- **Recent Trades**: Latest executed trades with timestamp, price, and volume
- **WebSocket Updates**: Instant market data updates without polling
- **Symbol Selection**: Support for multiple trading symbols

## Running the Component

All components are containerized and can be run using Docker Compose:

```bash
docker-compose up -d
```

This will start:
- Redis server for message queuing
- C++ market data feed service
- FastAPI backend
- React frontend

## API Endpoints

### WebSocket

- `/ws/orderbook/{symbol}` - Live order book updates
- `/ws/trades/{symbol}` - Live trade updates

### REST

- `/api/market/symbols` - List of available market symbols
- `/api/market/orderbook/{symbol}` - Latest order book snapshot
- `/api/market/recent_trades/{symbol}` - Recent trades for a symbol

## Frontend Components

The frontend implementation includes several React components:

- `OrderBook.js` - Displays the order book with bid/ask visualization
- `RecentTrades.js` - Shows recent trade activity
- `MarketDataViewer.js` - Container component with controls for symbol selection

## Implementation Details

### C++ Market Data Feed

The C++ component uses libwebsockets for connecting to exchange APIs and includes:

- Multi-threaded WebSocket client
- JSON parsing with nlohmann/json
- Redis publisher for distribution

### FastAPI Backend 

The backend provides:

- WebSocket forwarding from Redis to clients
- REST endpoints for initial data loading
- Symbol information and data snapshots

### Frontend Visualization

The React frontend uses:

- WebSocket connection management
- Recharts for interactive depth visualization
- Real-time data binding and state management

## Exchange Support

Currently supports testnet connections to:
- Deribit
- BitMEX (partial)

Support for additional exchanges can be added by implementing their WebSocket protocols in the MarketDataFeed class.
