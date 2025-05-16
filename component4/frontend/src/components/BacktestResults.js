import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale } from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale);

const BacktestResults = () => {
  const location = useLocation();
  const [backtestData, setBacktestData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // In a real app, fetch data from API based on ID
    // For demo, use passed state or generate mock data
    setIsLoading(true);
    
    const fetchData = async () => {
      if (location.state && location.state.backtestId) {
        // Use data from navigation state
        setTimeout(() => {
          // Generate some mock PnL data
          const days = 30;
          const pnlHistory = [0];
          for (let i = 1; i < days; i++) {
            const lastPnl = pnlHistory[i-1];
            const change = Math.random() * 200 - 100;
            pnlHistory.push(lastPnl + change);
          }
          
          // Generate some sample trades
          const trades = [];
          for (let i = 0; i < 10; i++) {
            const side = Math.random() > 0.5 ? 'buy' : 'sell';
            const price = 45000 + (Math.random() * 2000 - 1000);
            const size = parseFloat((Math.random() * 1).toFixed(2));
            const pnl = parseFloat((Math.random() * 400 - 200).toFixed(2));
            
            trades.push({
              id: `T${i+1}`,
              timestamp: new Date(new Date().getTime() - (i * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
              side,
              price,
              size,
              pnl
            });
          }
          
          const mockData = {
            id: location.state.backtestId,
            strategyId: location.state.strategyId,
            strategyName: location.state.strategyName,
            instrument: location.state.instrument,
            initialCapital: location.state.initialCapital,
            startDate: location.state.startDate,
            endDate: location.state.endDate,
            pnlHistory,
            trades,
            metrics: {
              finalPnl: pnlHistory[pnlHistory.length - 1],
              maxDrawdown: parseFloat((Math.random() * 500).toFixed(2)),
              sharpeRatio: parseFloat((Math.random() * 2).toFixed(2)),
              winRate: parseFloat((Math.random() * 60 + 40).toFixed(2)),
              profitFactor: parseFloat((Math.random() * 3 + 0.5).toFixed(2))
            }
          };
          
          setBacktestData(mockData);
          setIsLoading(false);
        }, 500);
      } else {
        // No backtest ID provided, show error or load most recent
        setBacktestData(null);
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [location]);
  
  const chartData = {
    labels: backtestData?.pnlHistory.map((_, i) => i) || [],
    datasets: [
      {
        label: 'Cumulative PnL ($)',
        data: backtestData?.pnlHistory || [],
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
        title: {
          display: true,
          text: 'Trading Days',
          color: 'rgba(255, 255, 255, 0.7)',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
        }
      },
      y: {
        title: {
          display: true,
          text: 'PnL ($)',
          color: 'rgba(255, 255, 255, 0.7)',
        },
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
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `PnL: $${context.parsed.y.toFixed(2)}`;
          }
        }
      }
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!backtestData) {
    return (
      <div className="p-6">
        <div className="bg-red-800 text-red-200 p-4 rounded-lg">
          No backtest data available. Please run a backtest first.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Backtest Results</h1>
        <div className="text-gray-300">
          <span className="bg-gray-700 px-3 py-1 rounded">ID: {backtestData.id}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-lg font-medium text-gray-200 mb-3">Strategy Details</h2>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-gray-400">Strategy:</div>
            <div className="text-white">{backtestData.strategyName}</div>
            
            <div className="text-gray-400">Instrument:</div>
            <div className="text-white">{backtestData.instrument}</div>
            
            <div className="text-gray-400">Period:</div>
            <div className="text-white">{backtestData.startDate} to {backtestData.endDate}</div>
            
            <div className="text-gray-400">Initial Capital:</div>
            <div className="text-white">${backtestData.initialCapital.toLocaleString()}</div>
          </div>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-lg font-medium text-gray-200 mb-3">Performance Metrics</h2>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-gray-400">Final PnL:</div>
            <div className={`font-medium ${backtestData.metrics.finalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${backtestData.metrics.finalPnl.toFixed(2)}
            </div>
            
            <div className="text-gray-400">Max Drawdown:</div>
            <div className="text-red-400">${backtestData.metrics.maxDrawdown.toFixed(2)}</div>
            
            <div className="text-gray-400">Sharpe Ratio:</div>
            <div className="text-white">{backtestData.metrics.sharpeRatio.toFixed(2)}</div>
            
            <div className="text-gray-400">Win Rate:</div>
            <div className="text-white">{backtestData.metrics.winRate}%</div>
            
            <div className="text-gray-400">Profit Factor:</div>
            <div className="text-white">{backtestData.metrics.profitFactor.toFixed(2)}</div>
          </div>
        </div>
      </div>
      
      {/* PnL Chart */}
      <div className="bg-gray-800 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-medium text-gray-200 mb-3">PnL Performance</h2>
        <div className="h-80">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>
      
      {/* Trade History */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <h2 className="text-lg font-medium text-gray-200 p-4 border-b border-gray-700">Trade History</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Side</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Price</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Size</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">PnL</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {backtestData.trades.map((trade) => (
                <tr key={trade.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{trade.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{trade.timestamp}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${trade.side === 'buy' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                      {trade.side}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${trade.price.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{trade.size}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${trade.pnl.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BacktestResults;
