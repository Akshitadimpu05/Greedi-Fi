import React, { useState } from 'react';
import OrderBook from './OrderBook';
import RecentTrades from './RecentTrades';

const MarketDataViewer = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('BTC-PERPETUAL');
  const [availableSymbols] = useState([
    'BTC-PERPETUAL',
    'ETH-PERPETUAL',
    'SOL-PERPETUAL',
    'BTC-25JUN21'
  ]);

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Market Data Viewer</h1>
        <div className="flex items-center space-x-2">
          <span className="text-gray-300">Symbol:</span>
          <select
            className="bg-gray-700 text-white border border-gray-600 rounded p-2"
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
          >
            {availableSymbols.map((symbol) => (
              <option key={symbol} value={symbol}>{symbol}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <OrderBook symbol={selectedSymbol} />
        </div>
        <div>
          <RecentTrades symbol={selectedSymbol} />
        </div>
      </div>
    </div>
  );
};

export default MarketDataViewer;
