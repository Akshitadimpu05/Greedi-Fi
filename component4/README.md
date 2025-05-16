# Greedi-Fi: Historical Trade Visualization & Strategy Testing

This component provides the historical trade visualization and strategy testing functionality for the Greedi-Fi crypto derivatives trading platform.

## Features

- Interactive charts for visualizing past trades and price movements
- Upload and run trading strategies from a user-friendly interface
- Toggle between manual and algorithmic trading modes
- Backend C++ module for plug-and-play strategy templates
- REST API to load strategies and fetch backtest results
- Secure sandboxing of user strategies in testnet environment

## Project Structure

```
component4/
├── backend/
│   ├── api/               # FastAPI backend service
│   │   ├── main.py        # Main API application
│   │   ├── Dockerfile     # Docker configuration for API
│   │   └── requirements.txt # Python dependencies
│   └── cpp/               # C++ Strategy Engine
│       ├── StrategyEngine.h    # Main engine header
│       ├── StrategyEngine.cpp  # Engine implementation
│       ├── SampleStrategies.h  # Sample strategy templates
│       ├── main.cpp       # C++ application entry point
│       ├── CMakeLists.txt # CMake build configuration
│       └── Dockerfile     # Docker configuration for C++
├── frontend/
│   ├── src/               # React source files
│   ├── public/            # Static assets
│   ├── Dockerfile         # Docker configuration
│   ├── nginx.conf         # Nginx web server config
│   └── package.json       # JavaScript dependencies
└── docker-compose.yml     # Docker Compose configuration
```

## Running the Application

### Prerequisites

- Docker and Docker Compose
- Node.js 14+ (for local frontend development)
- Python 3.8+ (for local backend development)
- C++ build tools (for local C++ development)

### Using Docker Compose (Recommended)

1. Navigate to the component4 directory:
   ```
   cd /home/charvi/PROJECTS/Projects/Greedi-Fi/component4
   ```

2. Build and start all services:
   ```
   docker-compose up --build
   ```

3. Access the application:
   - Frontend: http://localhost:3000
   - API: http://localhost:8000
   - API documentation: http://localhost:8000/docs

### Running Services Individually (For Development)

#### Frontend

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

4. Access the frontend at http://localhost:3000

#### API Backend

1. Navigate to the API directory:
   ```
   cd backend/api
   ```

2. Create a virtual environment (optional):
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Run the server:
   ```
   uvicorn main:app --reload
   ```

5. Access the API at http://localhost:8000

#### C++ Strategy Engine

1. Navigate to the C++ directory:
   ```
   cd backend/cpp
   ```

2. Create a build directory:
   ```
   mkdir build && cd build
   ```

3. Configure and build:
   ```
   cmake ..
   make
   ```

4. Run the strategy engine:
   ```
   ./strategy_engine
   ```

## API Endpoints

- `GET /api/templates` - Get available strategy templates
- `POST /api/strategies` - Create a new strategy
- `GET /api/strategies` - List all strategies
- `GET /api/strategies/{strategy_id}` - Get a specific strategy
- `DELETE /api/strategies/{strategy_id}` - Delete a strategy
- `POST /api/backtest` - Run a backtest with a strategy
- `GET /api/backtest/{backtest_id}` - Get backtest results
- `GET /api/backtest` - List all backtest results
- `POST /api/strategy/upload` - Upload a custom strategy
- `GET /api/historical-data/{instrument}` - Get historical data for an instrument
