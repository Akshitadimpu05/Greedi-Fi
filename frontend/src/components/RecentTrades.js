import React, { useState, useEffect, useRef } from 'react';

const RecentTrades = ({ symbol = 'BTC-PERPETUAL' }) => {
  const [trades, setTrades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);
  const tradesContainerRef = useRef(null);
  
  // Format number with thousands separators and fixed decimals
  const formatNumber = (num, decimals = 2) => {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };
  
  // Format timestamp to time
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour12: false });
  };

  // Connect to WebSocket and handle trade updates
  useEffect(() => {
    const connectWebSocket = () => {
      const baseUrl = window.location.hostname === 'localhost' 
        ? `ws://${window.location.hostname}:8000` 
        : `wss://${window.location.host}`;
      
      const ws = new WebSocket(`${baseUrl}/ws/trades/${symbol}`);
      wsRef.current = ws;
      
      ws.onopen = () => {
        console.log('Trades WebSocket Connected');
        setError(null);
      };
      
      ws.onmessage = (event) => {
        try {
          const trade = JSON.parse(event.data);
          setTrades(prevTrades => {
            // Add new trade at the beginning and limit to 100 trades
            const newTrades = [trade, ...prevTrades.slice(0, 99)];
            return newTrades;
          });
          setIsLoading(false);
        } catch (err) {
          console.error('Error processing trade message', err);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket Error:', error);
        setError('Failed to connect to trades feed');
      };
      
      ws.onclose = () => {
        console.log('Trades WebSocket Disconnected');
        // Try to reconnect in 3 seconds
        setTimeout(connectWebSocket, 3000);
      };
    };
    
    // Initial connection
    connectWebSocket();
    
    // Fetch initial trades
    const fetchInitialTrades = async () => {
      try {
        const baseUrl = window.location.hostname === 'localhost' 
          ? `http://${window.location.hostname}:8000` 
          : window.location.origin;
        
        const response = await fetch(`${baseUrl}/api/market/recent_trades/${symbol}`);
        if (!response.ok) throw new Error('Failed to fetch trades');
        
        const data = await response.json();
        setTrades(data);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching trades:', err);
        setError(err.message);
      }
    };
    
    fetchInitialTrades();
    
    // Cleanup function
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [symbol]);
  
  // Auto-scroll to keep recent trades in view
  useEffect(() => {
    if (tradesContainerRef.current) {
      tradesContainerRef.current.scrollTop = 0;
    }
  }, [trades]);

  // If data is still loading, show a loading spinner
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-gray-900 text-white rounded-lg p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <div className="mt-4">Loading Recent Trades...</div>
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
        <h2 className="text-xl font-bold">{symbol} Recent Trades</h2>
      </div>
      
      {/* Recent Trades Header */}
      <div className="grid grid-cols-4 text-gray-400 text-sm mb-2">
        <div>Time</div>
        <div className="text-right">Price</div>
        <div className="text-right">Amount</div>
        <div className="text-right">Side</div>
      </div>
      
      {/* Trades List */}
      <div className="max-h-96 overflow-y-auto" ref={tradesContainerRef}>
        {trades.map((trade, index) => (
          <div 
            key={`trade-${index}-${trade.timestamp}`} 
            className={`grid grid-cols-4 hover:bg-gray-800 ${
              trade.side === 'buy' ? 'text-green-500' : 'text-red-500'
            }`}
          >
            <div>{formatTime(trade.timestamp)}</div>
            <div className="text-right">{formatNumber(trade.price)}</div>
            <div className="text-right">{formatNumber(trade.amount, 4)}</div>
            <div className="text-right capitalize">{trade.side}</div>
          </div>
        ))}
      </div>
      
      {/* Trade Statistics */}
      {trades.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-800 p-2 rounded">
            <div className="text-gray-400">24h Volume</div>
            <div className="text-lg font-bold">
              {formatNumber(
                trades.reduce((sum, trade) => sum + trade.amount, 0), 
                2
              )}
            </div>
          </div>
          <div className="bg-gray-800 p-2 rounded">
            <div className="text-gray-400">Last Price</div>
            <div className={`text-lg font-bold ${
              trades[0].side === 'buy' ? 'text-green-500' : 'text-red-500'
            }`}>
              {formatNumber(trades[0].price)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecentTrades;
