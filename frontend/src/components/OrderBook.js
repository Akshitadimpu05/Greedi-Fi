import React, { useState, useEffect, useRef } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

const OrderBook = ({ symbol = 'BTC-PERPETUAL' }) => {
  const [orderBook, setOrderBook] = useState({ bids: [], asks: [] });
  const [maxDepth, setMaxDepth] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const wsRef = useRef(null);

  // Format number with thousands separators and fixed decimals
  const formatNumber = (num, decimals = 2) => {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  // Calculate the total amount at each price level (cumulative)
  const processOrderBookData = (data) => {
    const { bids, asks } = data;
    
    // Process bids (buy orders)
    let bidTotal = 0;
    const processedBids = bids.slice(0, maxDepth).map(([price, amount]) => {
      bidTotal += amount;
      return {
        price: parseFloat(price),
        amount: parseFloat(amount),
        total: bidTotal,
        type: 'bid'
      };
    });
    
    // Process asks (sell orders)
    let askTotal = 0;
    const processedAsks = asks.slice(0, maxDepth).map(([price, amount]) => {
      askTotal += amount;
      return {
        price: parseFloat(price),
        amount: parseFloat(amount),
        total: askTotal,
        type: 'ask'
      };
    }).reverse(); // Reverse to show highest price at top
    
    return {
      bids: processedBids,
      asks: processedAsks
    };
  };

  // Connect to WebSocket and handle order book updates
  useEffect(() => {
    const connectWebSocket = () => {
      const baseUrl = window.location.hostname === 'localhost' 
        ? `ws://${window.location.hostname}:8000` 
        : `wss://${window.location.host}`;
      
      const ws = new WebSocket(`${baseUrl}/ws/orderbook/${symbol}`);
      wsRef.current = ws;
      
      ws.onopen = () => {
        console.log('OrderBook WebSocket Connected');
        setError(null);
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setOrderBook(processOrderBookData(data));
          setLastUpdated(new Date().toLocaleTimeString());
          setIsLoading(false);
        } catch (err) {
          console.error('Error processing message', err);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket Error:', error);
        setError('Failed to connect to order book feed');
      };
      
      ws.onclose = () => {
        console.log('OrderBook WebSocket Disconnected');
        // Try to reconnect in 3 seconds
        setTimeout(connectWebSocket, 3000);
      };
    };
    
    // Initial connection
    connectWebSocket();
    
    // Fetch initial order book snapshot
    const fetchInitialOrderBook = async () => {
      try {
        const baseUrl = window.location.hostname === 'localhost' 
          ? `http://${window.location.hostname}:8000` 
          : window.location.origin;
        
        const response = await fetch(`${baseUrl}/api/market/orderbook/${symbol}`);
        if (!response.ok) throw new Error('Failed to fetch order book');
        
        const data = await response.json();
        setOrderBook(processOrderBookData(data));
        setLastUpdated(new Date().toLocaleTimeString());
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching order book:', err);
        setError(err.message);
      }
    };
    
    fetchInitialOrderBook();
    
    // Cleanup function
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [symbol, maxDepth]);

  // Calculate the spread between the highest bid and lowest ask
  const spread = orderBook.bids.length > 0 && orderBook.asks.length > 0
    ? orderBook.asks[orderBook.asks.length - 1].price - orderBook.bids[0].price
    : 0;
  
  const spreadPercentage = orderBook.bids.length > 0 && orderBook.asks.length > 0
    ? (spread / orderBook.bids[0].price) * 100
    : 0;

  // Combine bids and asks for the depth chart
  const depthChartData = [
    ...orderBook.bids.map(item => ({
      price: item.price,
      total: item.total,
      type: 'bid'
    })),
    ...orderBook.asks.map(item => ({
      price: item.price,
      total: item.total,
      type: 'ask'
    }))
  ];

  // Get the highest total value for scaling the chart
  const maxTotal = Math.max(
    orderBook.bids.length > 0 ? orderBook.bids[orderBook.bids.length - 1].total : 0,
    orderBook.asks.length > 0 ? orderBook.asks[0].total : 0
  );

  // If data is still loading, show a loading spinner
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-gray-900 text-white rounded-lg p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        <div className="mt-4">Loading Order Book...</div>
      </div>
    );
  }

  // If there was an error, show an error message
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-gray-900 text-white rounded-lg p-4">
        <div className="text-red-500 text-xl">⚠️ {error}</div>
        <div className="mt-4">Please try again later.</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 text-white rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{symbol} Order Book</h2>
        <div className="text-sm">
          Last updated: {lastUpdated || 'Never'}
        </div>
      </div>
      
      {/* Depth Chart */}
      <div className="h-48 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={depthChartData}
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
          >
            <XAxis 
              dataKey="price" 
              type="number" 
              domain={['dataMin', 'dataMax']} 
              tickFormatter={(value) => formatNumber(value)}
              tick={{ fill: '#9CA3AF' }} 
            />
            <YAxis 
              domain={[0, maxTotal * 1.1]} 
              tickFormatter={(value) => formatNumber(value, 1)}
              tick={{ fill: '#9CA3AF' }} 
            />
            <Tooltip 
              formatter={(value, name) => [formatNumber(value), name === 'total' ? 'Total Volume' : name]}
              labelFormatter={(label) => `Price: ${formatNumber(label)}`}
              contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
            />
            <Bar dataKey="total">
              {depthChartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.type === 'bid' ? '#10B981' : '#EF4444'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Order Book Header */}
      <div className="grid grid-cols-3 text-gray-400 text-sm mb-2">
        <div>Price</div>
        <div className="text-right">Amount</div>
        <div className="text-right">Total</div>
      </div>
      
      {/* Asks (Sell Orders) */}
      <div className="mb-4 max-h-48 overflow-y-auto">
        {orderBook.asks.map((ask, index) => (
          <div key={`ask-${index}`} className="grid grid-cols-3 text-red-500 hover:bg-gray-800">
            <div>{formatNumber(ask.price)}</div>
            <div className="text-right">{formatNumber(ask.amount, 4)}</div>
            <div className="text-right">{formatNumber(ask.total, 4)}</div>
          </div>
        ))}
      </div>
      
      {/* Spread */}
      <div className="text-center my-2 py-2 border-y border-gray-700">
        <span className="text-gray-400">Spread: </span>
        <span className="font-bold">{formatNumber(spread)} ({formatNumber(spreadPercentage, 4)}%)</span>
      </div>
      
      {/* Bids (Buy Orders) */}
      <div className="max-h-48 overflow-y-auto">
        {orderBook.bids.map((bid, index) => (
          <div key={`bid-${index}`} className="grid grid-cols-3 text-green-500 hover:bg-gray-800">
            <div>{formatNumber(bid.price)}</div>
            <div className="text-right">{formatNumber(bid.amount, 4)}</div>
            <div className="text-right">{formatNumber(bid.total, 4)}</div>
          </div>
        ))}
      </div>
      
      {/* Controls */}
      <div className="mt-4 flex justify-between items-center">
        <div className="text-sm text-gray-400">
          Showing {maxDepth} levels
        </div>
        <div>
          <select 
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm"
            value={maxDepth}
            onChange={(e) => setMaxDepth(parseInt(e.target.value))}
          >
            <option value="10">10 Levels</option>
            <option value="20">20 Levels</option>
            <option value="50">50 Levels</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default OrderBook;
