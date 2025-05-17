from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Dict, List, Optional, Any, Set
from pydantic import BaseModel, Field
import os
import json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import uuid
import asyncio
import subprocess
import uvicorn
import redis.asyncio as redis
from redis.exceptions import RedisError

app = FastAPI(title="Greedi-Fi Trading Platform API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with actual frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Market Data Models
class OrderBookEntry(BaseModel):
    price: float
    amount: float

class OrderBook(BaseModel):
    symbol: str
    timestamp: int
    bids: List[List[float]] = Field(description="List of [price, amount] pairs")
    asks: List[List[float]] = Field(description="List of [price, amount] pairs")

class Trade(BaseModel):
    symbol: str
    timestamp: int
    price: float
    amount: float
    side: str

# Strategy Models
class Strategy(BaseModel):
    id: Optional[str] = None
    name: str
    template: str
    parameters: Dict[str, str]

class BacktestRequest(BaseModel):
    strategy_id: str
    start_date: str
    end_date: str
    initial_capital: float
    instrument: str

class BacktestResult(BaseModel):
    id: str
    strategy_id: str
    timestamp: str
    pnl_history: List[float]
    trade_history: List[Dict]
    performance_metrics: Dict[str, float]

# In-memory storage for demo purposes
# In a production app, use a database
available_templates = {
    "moving_average_crossover": {
        "name": "Moving Average Crossover",
        "description": "Strategy that trades based on the crossover of two moving averages",
        "parameters": {
            "short_period": "Short moving average period",
            "long_period": "Long moving average period"
        }
    },
    "rsi": {
        "name": "Relative Strength Index",
        "description": "Strategy that trades based on RSI overbought/oversold levels",
        "parameters": {
            "period": "RSI calculation period",
            "oversold": "Oversold threshold (usually 30)",
            "overbought": "Overbought threshold (usually 70)"
        }
    }
}

# Redis connection setup
def get_redis_connection_pool():
    """Get or create Redis connection pool"""
    global redis_pool
    if redis_pool is None:
        redis_host = os.environ.get('REDIS_HOST', 'redis')
        redis_port = int(os.environ.get('REDIS_PORT', 6379))
        redis_pool = redis.ConnectionPool(host=redis_host, port=redis_port, db=0)
    return redis_pool

# Initialize pool at module level
redis_pool = None

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, channel: str):
        await websocket.accept()
        if channel not in self.active_connections:
            self.active_connections[channel] = set()
        self.active_connections[channel].add(websocket)

    def disconnect(self, websocket: WebSocket, channel: str):
        if channel in self.active_connections:
            self.active_connections[channel].discard(websocket)

    async def broadcast(self, message: str, channel: str):
        if channel in self.active_connections:
            for connection in self.active_connections[channel]:
                try:
                    await connection.send_text(message)
                except WebSocketDisconnect:
                    # Will be removed on next disconnect call
                    pass

manager = ConnectionManager()

# Background task to forward Redis messages to WebSocket clients
async def forward_redis_messages():
    r = redis.Redis(connection_pool=get_redis_connection_pool())
    pubsub = r.pubsub()
    
    # Subscribe to all orderbook and trade channels
    await pubsub.psubscribe("orderbook:*")
    await pubsub.psubscribe("trades:*")
    
    try:
        while True:
            message = await pubsub.get_message(ignore_subscribe_messages=True)
            if message and message['type'] == 'pmessage':
                channel = message['channel'].decode('utf-8')
                data = message['data'].decode('utf-8')
                await manager.broadcast(data, channel)
    except Exception as e:
        print(f"Error in Redis subscription: {e}")
    finally:
        await pubsub.unsubscribe()
        await r.close()

# Start the background task
@app.on_event("startup")
async def startup_event():
    asyncio.create_task(forward_redis_messages())

# In-memory storage for demo purposes
# In a production app, use a database
strategies = {}
backtest_results = {}

# Generate sample historical data for testing
def generate_sample_data(instrument: str, start_date: str, end_date: str):
    start = datetime.strptime(start_date, "%Y-%m-%d")
    end = datetime.strptime(end_date, "%Y-%m-%d")
    
    # Generate dates
    dates = []
    current = start
    while current <= end:
        if current.weekday() < 5:  # Only business days
            dates.append(current.strftime("%Y-%m-%d"))
        current += timedelta(days=1)
    
    # Generate simulated price data
    np.random.seed(42)  # For reproducibility
    price = 10000.0  # Starting price
    prices = [price]
    
    for _ in range(1, len(dates)):
        # Random walk with drift
        change_percent = np.random.normal(0.0001, 0.02)  # 0.01% drift, 2% std dev
        price *= (1 + change_percent)
        prices.append(price)
    
    # Generate volume data
    volumes = np.random.normal(100, 30, len(dates))
    volumes = np.maximum(volumes, 10)  # Ensure minimum volume
    
    # Create dataframe
    df = pd.DataFrame({
        'date': dates,
        'price': prices,
        'volume': volumes,
        'instrument': instrument
    })
    
    return df.to_dict('records')

# Routes
@app.get("/")
async def root():
    return {"message": "Greedi-Fi Trading Platform API"}

@app.get("/health")
async def health_check():
    try:
        # Check if Redis is accessible
        r = redis.Redis(connection_pool=get_redis_connection_pool())
        await r.ping()
        return {"status": "healthy", "redis": "connected"}
    except RedisError as e:
        return JSONResponse(
            status_code=503,
            content={"status": "unhealthy", "redis": str(e)}
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"status": "unhealthy", "error": str(e)}
        )

@app.get("/api/templates")
async def get_templates():
    return available_templates

@app.post("/api/strategies", response_model=Strategy)
async def create_strategy(strategy: Strategy):
    # Validate template exists
    if strategy.template not in available_templates:
        raise HTTPException(status_code=400, detail="Invalid strategy template")
    
    # Create unique ID if not provided
    if not strategy.id:
        strategy.id = f"strategy_{uuid.uuid4().hex[:8]}"
    
    # Store strategy
    strategies[strategy.id] = strategy.dict()
    
    # In a real implementation, we would call the C++ engine to create the strategy
    # For now, we'll just return the strategy object
    return strategy

@app.get("/api/strategies")
async def list_strategies():
    return list(strategies.values())

@app.get("/api/strategies/{strategy_id}")
async def get_strategy(strategy_id: str):
    if strategy_id not in strategies:
        raise HTTPException(status_code=404, detail="Strategy not found")
    return strategies[strategy_id]

@app.delete("/api/strategies/{strategy_id}")
async def delete_strategy(strategy_id: str):
    if strategy_id not in strategies:
        raise HTTPException(status_code=404, detail="Strategy not found")
    
    # Delete the strategy
    del strategies[strategy_id]
    
    # In a real implementation, we would call the C++ engine to delete the strategy
    return {"status": "success", "message": "Strategy deleted"}

@app.post("/api/backtest", response_model=BacktestResult)
async def run_backtest(request: BacktestRequest):
    if request.strategy_id not in strategies:
        raise HTTPException(status_code=404, detail="Strategy not found")
    
    # Generate sample historical data
    historical_data = generate_sample_data(
        request.instrument, 
        request.start_date, 
        request.end_date
    )
    
    # In a real implementation, we would call the C++ engine to run the backtest
    # For now, we'll simulate the backtest
    
    # Simulate PnL history
    days = len(historical_data)
    np.random.seed(int(hash(request.strategy_id) % 10000))  # Seed based on strategy ID
    
    # Create a sample PnL curve based on strategy parameters
    strategy = strategies[request.strategy_id]
    
    # Different patterns based on strategy type
    if strategy["template"] == "moving_average_crossover":
        short_period = int(strategy["parameters"].get("short_period", "10"))
        long_period = int(strategy["parameters"].get("long_period", "30"))
        
        # More responsive strategies (lower period) tend to be more volatile
        volatility = 1 / (short_period / 10)
        
        # Simulate PnL with some characteristic behavior
        pnl = [0]
        for i in range(1, days):
            if i % (short_period // 2) == 0:
                # Periodic changes to simulate crossovers
                change = np.random.normal(0.005, 0.02 * volatility)
                pnl.append(pnl[-1] + change * request.initial_capital)
            else:
                change = np.random.normal(0.001, 0.01 * volatility)
                pnl.append(pnl[-1] + change * request.initial_capital)
    
    elif strategy["template"] == "rsi":
        period = int(strategy["parameters"].get("period", "14"))
        volatility = 1 / (period / 14)
        
        # RSI tends to perform well in ranging markets but poorly in trends
        pnl = [0]
        trend = np.random.choice([-1, 1])  # Random initial trend
        
        for i in range(1, days):
            if i % 20 == 0:  # Periodic trend changes
                trend *= -1
            
            # RSI strategies perform differently in different market conditions
            if trend == 1:  # Trending market - RSI struggles
                change = np.random.normal(-0.002, 0.015 * volatility)
            else:  # Ranging market - RSI does well
                change = np.random.normal(0.004, 0.015 * volatility)
                
            pnl.append(pnl[-1] + change * request.initial_capital)
    
    else:
        # Generic PnL simulation for unknown strategies
        pnl = [0]
        for i in range(1, days):
            change = np.random.normal(0.001, 0.015)
            pnl.append(pnl[-1] + change * request.initial_capital)
    
    # Generate some sample trades
    trades = []
    for i in range(5, days, max(days // 10, 1)):
        side = "buy" if np.random.random() > 0.5 else "sell"
        price = historical_data[i]["price"]
        size = np.random.uniform(0.1, 1.0) * request.initial_capital / price
        
        trades.append({
            "timestamp": historical_data[i]["date"],
            "instrument": request.instrument,
            "side": side,
            "price": price,
            "size": size,
            "pnl": pnl[i] - pnl[i-1]
        })
    
    # Calculate some performance metrics
    final_pnl = pnl[-1]
    max_drawdown = 0
    peak = 0
    
    for p in pnl:
        if p > peak:
            peak = p
        drawdown = peak - p
        if drawdown > max_drawdown:
            max_drawdown = drawdown
    
    sharpe = np.mean(np.diff(pnl)) / np.std(np.diff(pnl)) * np.sqrt(252) if len(pnl) > 1 else 0
    
    # Create result object
    result_id = f"backtest_{uuid.uuid4().hex[:8]}"
    result = {
        "id": result_id,
        "strategy_id": request.strategy_id,
        "timestamp": datetime.now().isoformat(),
        "pnl_history": pnl,
        "trade_history": trades,
        "performance_metrics": {
            "final_pnl": final_pnl,
            "max_drawdown": max_drawdown,
            "sharpe_ratio": sharpe,
            "win_rate": sum(1 for t in trades if t["pnl"] > 0) / len(trades) if trades else 0,
            "profit_factor": sum(t["pnl"] for t in trades if t["pnl"] > 0) / (abs(sum(t["pnl"] for t in trades if t["pnl"] < 0)) or 1)
        }
    }
    
    # Store result
    backtest_results[result_id] = result
    
    return result

@app.get("/api/backtest/{backtest_id}")
async def get_backtest_result(backtest_id: str):
    if backtest_id not in backtest_results:
        raise HTTPException(status_code=404, detail="Backtest result not found")
    return backtest_results[backtest_id]

@app.get("/api/backtest")
async def list_backtest_results():
    return list(backtest_results.values())

@app.post("/api/strategy/upload")
async def upload_strategy(
    file: UploadFile = File(...),
    name: str = Form(...),
):
    # In a real implementation, we would validate and securely store the uploaded file
    # Here we'll just return a success response
    
    strategy_id = f"custom_{uuid.uuid4().hex[:8]}"
    
    # Store strategy metadata
    strategies[strategy_id] = {
        "id": strategy_id,
        "name": name,
        "template": "custom",
        "parameters": {},
        "uploaded_file": file.filename
    }
    
    return {
        "id": strategy_id,
        "name": name,
        "message": "Strategy uploaded successfully"
    }

@app.get("/api/historical-data/{instrument}")
async def get_historical_data(instrument: str, start_date: str, end_date: str):
    # In a real implementation, we would fetch this from a database or exchange API
    # For now, we'll generate sample data
    return generate_sample_data(instrument, start_date, end_date)

# Market Data WebSocket Endpoints
@app.websocket("/ws/orderbook/{symbol}")
async def orderbook_ws(websocket: WebSocket, symbol: str):
    channel = f"orderbook:{symbol}"
    
    try:
        await manager.connect(websocket, channel)
        
        # Send initial snapshot if available
        try:
            r = redis.Redis(connection_pool=get_redis_connection_pool())
            snapshot = await r.get(f"orderbook_snapshot:{symbol}")
            if snapshot:
                await websocket.send_text(snapshot.decode('utf-8'))
            await r.close()
        except RedisError as e:
            print(f"Redis error getting initial snapshot: {e}")
        
        # Keep connection alive until client disconnects
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, channel)

@app.websocket("/ws/trades/{symbol}")
async def trades_ws(websocket: WebSocket, symbol: str):
    channel = f"trades:{symbol}"
    
    try:
        await manager.connect(websocket, channel)
        
        # Keep connection alive until client disconnects
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, channel)

# Market Data REST Endpoints
@app.get("/api/market/symbols")
async def get_available_symbols():
    # In production, this would query the exchange or a database
    # For now, return a static list of supported symbols
    return [
        "BTC-PERPETUAL",
        "ETH-PERPETUAL",
        "SOL-PERPETUAL",
        "BTC-25JUN21"
    ]

@app.get("/api/market/orderbook/{symbol}")
async def get_orderbook_snapshot(symbol: str):
    try:
        r = redis.Redis(connection_pool=get_redis_connection_pool())
        snapshot = await r.get(f"orderbook_snapshot:{symbol}")
        await r.close()
        
        if not snapshot:
            return JSONResponse(
                status_code=404,
                content={"error": f"No order book data available for {symbol}"}
            )
            
        return json.loads(snapshot.decode('utf-8'))
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to fetch order book: {str(e)}"}
        )

@app.get("/api/market/recent_trades/{symbol}")
async def get_recent_trades(symbol: str, limit: int = 50):
    # In a real implementation, this would query Redis or a database
    # For demo purposes, we'll generate some random trades
    trades = []
    current_time = int(datetime.now().timestamp() * 1000)
    price = 45000.0 if "BTC" in symbol else 3000.0  # Base price depends on symbol
    
    for i in range(limit):
        # Time goes backwards as we generate older trades
        timestamp = current_time - (i * 5000)  # 5 seconds between trades
        
        # Small random price movement
        price_change = np.random.normal(0, 0.001) * price
        trade_price = price + price_change
        
        # Random amount
        amount = round(np.random.uniform(0.01, 1.0), 4)
        
        # Random side
        side = "buy" if np.random.random() > 0.5 else "sell"
        
        trades.append({
            "symbol": symbol,
            "timestamp": timestamp,
            "price": round(trade_price, 2),
            "amount": amount,
            "side": side
        })
        
        # Update price for next trade
        price = trade_price
    
    return trades

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
