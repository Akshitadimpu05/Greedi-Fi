import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale } from 'chart.js';
import 'chartjs-adapter-moment';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale);

const Dashboard = ({ isAlgoMode }) => {
  const [historicalData, setHistoricalData] = useState(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1d');
  const [isLoading, setIsLoading] = useState(true);

  const timeframes = ['1h', '4h', '1d', '1w', '1m'];
  
  useEffect(() => {
    // In a real app, fetch this from the API
    // For now, simulate loading historical data
    setIsLoading(true);
    
    // Generate some fake historical data for the chart
    const generateHistoricalData = () => {
      const now = new Date();
      const data = [];
      
      let price = 45000; // Starting price
      
      // Generate data points based on selected timeframe
      let points = 0;
      let timeIncrement = 0;
      
      switch(selectedTimeframe) {
        case '1h':
          points = 60;
          timeIncrement = 60 * 1000; // 1 minute
          break;
        case '4h':
          points = 48;
          timeIncrement = 5 * 60 * 1000; // 5 minutes
          break;
        case '1d':
          points = 24;
          timeIncrement = 60 * 60 * 1000; // 1 hour
          break;
        case '1w':
          points = 168;
          timeIncrement = 60 * 60 * 1000; // 1 hour
          break;
        case '1m':
          points = 30;
          timeIncrement = 24 * 60 * 60 * 1000; // 1 day
          break;
        default:
          points = 24;
          timeIncrement = 60 * 60 * 1000; // 1 hour
      }
      
      for (let i = points; i >= 0; i--) {
        const time = new Date(now.getTime() - (i * timeIncrement));
        
        // Random price change with some trend
        const change = (Math.random() - 0.5) * 100;
        price += change;
        
        data.push({
          timestamp: time,
          price: price,
          volume: Math.random() * 10 + 2
        });
      }
      
      return data;
    };
    
    // Simulate API call delay
    setTimeout(() => {
      const data = generateHistoricalData();
      setHistoricalData(data);
      setIsLoading(false);
    }, 500);
    
  }, [selectedTimeframe]);
  
  const chartData = {
    labels: historicalData?.map(d => d.timestamp) || [],
    datasets: [
      {
        label: 'BTC/USD',
        data: historicalData?.map(d => d.price) || [],
        fill: false,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        tension: 0.1,
      }
    ]
  };
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: selectedTimeframe === '1d' ? 'hour' : selectedTimeframe === '1w' ? 'day' : selectedTimeframe === '1m' ? 'day' : 'minute',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
        }
      }
    },
    plugins: {
      legend: {
        labels: {
          color: 'rgba(255, 255, 255, 0.7)',
        }
      }
    }
  };
  
  // Mock trade data for table display
  const recentTrades = [
    { id: 'T1', time: '10:30:45', side: 'buy', price: 44950, size: 0.2, pnl: '+$120.50' },
    { id: 'T2', time: '10:28:32', side: 'sell', price: 45010, size: 0.5, pnl: '+$250.75' },
    { id: 'T3', time: '10:25:18', side: 'sell', price: 45125, size: 0.1, pnl: '-$45.25' },
    { id: 'T4', time: '10:20:05', side: 'buy', price: 45200, size: 0.3, pnl: '-$85.00' },
    { id: 'T5', time: '10:15:37', side: 'buy', price: 44875, size: 0.4, pnl: '+$180.30' },
  ];

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Historical Trade Visualization</h1>
        <div className="flex items-center">
          <span className="text-gray-300 mr-4">Mode: {isAlgoMode ? 'Algorithmic' : 'Manual'}</span>
          <div className="bg-gray-800 rounded-lg flex">
            {timeframes.map((tf) => (
              <button
                key={tf}
                className={`px-3 py-2 text-sm ${selectedTimeframe === tf ? 'bg-green-500 text-white rounded-lg' : 'text-gray-400'}`}
                onClick={() => setSelectedTimeframe(tf)}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="bg-gray-800 rounded-lg p-4 flex-1">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
          </div>
        ) : (
          <div className="h-full">
            <Line data={chartData} options={chartOptions} />
          </div>
        )}
      </div>
      
      <div className="mt-6">
        <h2 className="text-xl font-bold text-white mb-3">Recent Trades</h2>
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Time</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Side</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Price</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Size</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">PnL</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {recentTrades.map((trade) => (
                <tr key={trade.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{trade.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{trade.time}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${trade.side === 'buy' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                      {trade.side}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${trade.price.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{trade.size}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${trade.pnl.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>{trade.pnl}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
