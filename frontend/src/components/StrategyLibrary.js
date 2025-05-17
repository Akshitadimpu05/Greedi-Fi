import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaRobot, FaPlay, FaTrash, FaEdit, FaInfo, FaCodeBranch } from 'react-icons/fa';

const StrategyLibrary = () => {
  const navigate = useNavigate();
  const [strategies, setStrategies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  
  useEffect(() => {
    // In a real app, fetch from API
    // For demo, use mock data
    setTimeout(() => {
      const mockStrategies = [
        {
          id: 'strategy_12345',
          name: 'MA Crossover 10/30',
          template: 'moving_average_crossover',
          parameters: { short_period: '10', long_period: '30' },
          description: 'Simple moving average crossover strategy using 10 and 30 period MAs',
          created_at: '2025-05-10T12:30:00Z',
          stats: {
            backtest_count: 5,
            best_performance: '+12.5%',
            worst_performance: '-3.2%'
          }
        },
        {
          id: 'strategy_23456',
          name: 'RSI Reversal Strategy',
          template: 'rsi',
          parameters: { period: '14', oversold: '30', overbought: '70' },
          description: 'RSI-based mean reversion strategy that buys oversold conditions and sells overbought',
          created_at: '2025-05-12T09:45:00Z',
          stats: {
            backtest_count: 3,
            best_performance: '+8.7%',
            worst_performance: '-5.1%'
          }
        },
        {
          id: 'strategy_34567',
          name: 'Custom MACD Strategy',
          template: 'custom',
          parameters: {},
          description: 'Custom uploaded MACD strategy with trend filtering',
          created_at: '2025-05-15T14:20:00Z',
          stats: {
            backtest_count: 1,
            best_performance: '+4.3%',
            worst_performance: '+4.3%'
          }
        }
      ];
      
      setStrategies(mockStrategies);
      setIsLoading(false);
    }, 500);
  }, []);
  
  const handleRunBacktest = (strategyId) => {
    navigate('/backtest', { state: { strategyId } });
  };
  
  const handleDeleteStrategy = (strategyId) => {
    // In a real app, call API to delete
    setStrategies(strategies.filter(s => s.id !== strategyId));
  };
  
  const handleViewDetails = (strategy) => {
    setSelectedStrategy(strategy);
  };
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Strategy Library</h1>
      
      <div className="grid grid-cols-1 gap-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
          </div>
        ) : strategies.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <FaRobot className="mx-auto text-4xl text-gray-500 mb-4" />
            <h3 className="text-xl font-medium text-gray-300 mb-2">No Strategies Yet</h3>
            <p className="text-gray-400 mb-6">Create your first trading strategy to get started.</p>
            <button
              onClick={() => navigate('/strategies')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none"
            >
              Create Strategy
            </button>
          </div>
        ) : (
          <>
            {strategies.map(strategy => (
              <div key={strategy.id} className="bg-gray-800 rounded-lg overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="text-xl font-medium text-white mb-2">
                        {strategy.name}
                      </h3>
                      <p className="text-gray-400 text-sm mb-4">{strategy.description}</p>
                    </div>
                    <div className="flex items-start">
                      <div className="bg-gray-700 rounded px-2 py-1 text-xs text-gray-300">
                        {strategy.template === 'custom' ? 'Custom' : strategy.template}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-700 p-3 rounded">
                      <p className="text-xs text-gray-400 mb-1">Backtests</p>
                      <p className="text-lg text-white">{strategy.stats.backtest_count}</p>
                    </div>
                    <div className="bg-gray-700 p-3 rounded">
                      <p className="text-xs text-gray-400 mb-1">Best</p>
                      <p className="text-lg text-green-400">{strategy.stats.best_performance}</p>
                    </div>
                    <div className="bg-gray-700 p-3 rounded">
                      <p className="text-xs text-gray-400 mb-1">Worst</p>
                      <p className={`text-lg ${strategy.stats.worst_performance.startsWith('-') ? 'text-red-400' : 'text-green-400'}`}>
                        {strategy.stats.worst_performance}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleRunBacktest(strategy.id)}
                      className="px-3 py-2 bg-green-600 text-white rounded flex items-center hover:bg-green-700 focus:outline-none"
                    >
                      <FaPlay className="mr-1" /> Run
                    </button>
                    <button
                      onClick={() => handleViewDetails(strategy)}
                      className="px-3 py-2 bg-blue-600 text-white rounded flex items-center hover:bg-blue-700 focus:outline-none"
                    >
                      <FaInfo className="mr-1" /> Details
                    </button>
                    <button
                      onClick={() => navigate('/strategies', { state: { edit: strategy } })}
                      className="px-3 py-2 bg-gray-600 text-white rounded flex items-center hover:bg-gray-700 focus:outline-none"
                    >
                      <FaEdit className="mr-1" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteStrategy(strategy.id)}
                      className="px-3 py-2 bg-red-600 text-white rounded flex items-center hover:bg-red-700 focus:outline-none"
                    >
                      <FaTrash className="mr-1" /> Delete
                    </button>
                    <button
                      onClick={() => navigate('/library', { state: { clone: strategy } })}
                      className="px-3 py-2 bg-purple-600 text-white rounded flex items-center hover:bg-purple-700 focus:outline-none"
                    >
                      <FaCodeBranch className="mr-1" /> Clone
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
      
      {/* Strategy details modal */}
      {selectedStrategy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-screen overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">{selectedStrategy.name}</h3>
                <button
                  onClick={() => setSelectedStrategy(null)}
                  className="text-gray-400 hover:text-white"
                >
                  &times;
                </button>
              </div>
              
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-400 mb-1">Description</h4>
                <p className="text-white">{selectedStrategy.description}</p>
              </div>
              
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-400 mb-1">Template</h4>
                <p className="text-white">{selectedStrategy.template}</p>
              </div>
              
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-400 mb-1">Parameters</h4>
                {Object.keys(selectedStrategy.parameters).length > 0 ? (
                  <div className="bg-gray-700 rounded-lg p-4">
                    {Object.entries(selectedStrategy.parameters).map(([key, value]) => (
                      <div key={key} className="flex justify-between py-1">
                        <span className="text-gray-300">{key}:</span>
                        <span className="text-white">{value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400">No parameters for custom strategy</p>
                )}
              </div>
              
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-400 mb-1">Performance</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-700 p-3 rounded">
                    <p className="text-xs text-gray-400 mb-1">Backtests Run</p>
                    <p className="text-lg text-white">{selectedStrategy.stats.backtest_count}</p>
                  </div>
                  <div className="bg-gray-700 p-3 rounded">
                    <p className="text-xs text-gray-400 mb-1">Best Performance</p>
                    <p className="text-lg text-green-400">{selectedStrategy.stats.best_performance}</p>
                  </div>
                  <div className="bg-gray-700 p-3 rounded">
                    <p className="text-xs text-gray-400 mb-1">Worst Performance</p>
                    <p className={`text-lg ${selectedStrategy.stats.worst_performance.startsWith('-') ? 'text-red-400' : 'text-green-400'}`}>
                      {selectedStrategy.stats.worst_performance}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setSelectedStrategy(null);
                    handleRunBacktest(selectedStrategy.id);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none"
                >
                  Run Backtest
                </button>
                <button
                  onClick={() => setSelectedStrategy(null)}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 focus:outline-none"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StrategyLibrary;
