import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const BacktestRunner = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [strategies, setStrategies] = useState([]);
  const [selectedStrategy, setSelectedStrategy] = useState('');
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    initialCapital: 10000,
    instrument: 'BTC-USD'
  });
  const [message, setMessage] = useState({ text: '', type: '' });

  // Available instruments for testing
  const instruments = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'XRP-USD', 'ADA-USD'];

  useEffect(() => {
    // In a real app, fetch from API
    // For demo, use mock data
    setTimeout(() => {
      const mockStrategies = [
        { id: 'strategy_12345', name: 'MA Crossover 10/30' },
        { id: 'strategy_23456', name: 'RSI Reversal Strategy' },
        { id: 'strategy_34567', name: 'Custom MACD Strategy' }
      ];
      
      setStrategies(mockStrategies);
      setIsLoading(false);
      
      // Set default dates (last month to today)
      const today = new Date();
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      
      setFormData(prev => ({
        ...prev,
        startDate: lastMonth.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      }));
    }, 500);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let parsedValue = value;
    
    if (name === 'initialCapital') {
      parsedValue = parseFloat(value) || 0;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: parsedValue
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!selectedStrategy) {
      setMessage({ text: 'Please select a strategy', type: 'error' });
      return;
    }
    
    if (!formData.startDate || !formData.endDate) {
      setMessage({ text: 'Please select start and end dates', type: 'error' });
      return;
    }
    
    if (formData.initialCapital <= 0) {
      setMessage({ text: 'Initial capital must be greater than zero', type: 'error' });
      return;
    }
    
    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      setMessage({ text: 'End date must be after start date', type: 'error' });
      return;
    }
    
    // In a real app, send to API
    setMessage({ text: 'Running backtest...', type: 'info' });
    setIsLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      setIsLoading(false);
      setMessage({ text: 'Backtest completed successfully!', type: 'success' });
      
      // Navigate to results page after a brief delay
      setTimeout(() => {
        navigate('/results', { state: { 
          backtestId: 'backtest_' + Math.random().toString(36).substring(7),
          strategyId: selectedStrategy,
          strategyName: strategies.find(s => s.id === selectedStrategy)?.name,
          instrument: formData.instrument,
          initialCapital: formData.initialCapital,
          startDate: formData.startDate,
          endDate: formData.endDate
        }});
      }, 1000);
    }, 2000);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Backtest Strategy</h1>
      
      {message.text && (
        <div className={`p-4 rounded mb-6 ${
          message.type === 'success' ? 'bg-green-800 text-green-200' : 
          message.type === 'error' ? 'bg-red-800 text-red-200' :
          'bg-blue-800 text-blue-200'
        }`}>
          {message.text}
        </div>
      )}
      
      <div className="bg-gray-800 rounded-lg p-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="strategy" className="block text-sm font-medium text-gray-300 mb-2">Select Strategy</label>
            <select
              id="strategy"
              className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-green-500 focus:outline-none"
              value={selectedStrategy}
              onChange={(e) => setSelectedStrategy(e.target.value)}
              disabled={isLoading}
              required
            >
              <option value="">-- Select a strategy --</option>
              {strategies.map(strategy => (
                <option key={strategy.id} value={strategy.id}>{strategy.name}</option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-green-500 focus:outline-none"
                value={formData.startDate}
                onChange={handleInputChange}
                disabled={isLoading}
                required
              />
            </div>
            
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-300 mb-2">End Date</label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-green-500 focus:outline-none"
                value={formData.endDate}
                onChange={handleInputChange}
                disabled={isLoading}
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label htmlFor="instrument" className="block text-sm font-medium text-gray-300 mb-2">Instrument</label>
              <select
                id="instrument"
                name="instrument"
                className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-green-500 focus:outline-none"
                value={formData.instrument}
                onChange={handleInputChange}
                disabled={isLoading}
                required
              >
                {instruments.map(instrument => (
                  <option key={instrument} value={instrument}>{instrument}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="initialCapital" className="block text-sm font-medium text-gray-300 mb-2">Initial Capital ($)</label>
              <input
                type="number"
                id="initialCapital"
                name="initialCapital"
                className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-green-500 focus:outline-none"
                value={formData.initialCapital}
                onChange={handleInputChange}
                min="1"
                step="100"
                disabled={isLoading}
                required
              />
            </div>
          </div>
          
          <div className="mt-8">
            <button
              type="submit"
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Running Backtest...
                </span>
              ) : (
                'Run Backtest'
              )}
            </button>
          </div>
          
          <div className="mt-4 text-sm text-gray-400">
            <p>The backtest will use historical market data to simulate how your strategy would have performed during the selected time period.</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BacktestRunner;
