import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import './App.css';
import Dashboard from './components/Dashboard';
import StrategyCreator from './components/StrategyCreator';
import BacktestRunner from './components/BacktestRunner';
import BacktestResults from './components/BacktestResults';
import StrategyLibrary from './components/StrategyLibrary';
import MarketDataViewer from './components/MarketDataViewer';
import { FaChartLine, FaRobot, FaHistory, FaBook, FaChartArea, FaExchangeAlt } from 'react-icons/fa';

function App() {
  const [isAlgoMode, setIsAlgoMode] = useState(false);
  
  return (
    <Router>
      <div className="flex h-screen bg-gray-900 text-white">
        {/* Sidebar */}
        <div className="w-64 bg-gray-800 p-5">
          <div className="mb-10">
            <h1 className="text-2xl font-bold text-green-400">Greedi-Fi</h1>
            <p className="text-sm text-gray-400">Strategy Testing & Visualization</p>
            
            <div className="mt-6 flex items-center">
              <span className="mr-3 text-sm">Manual</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={isAlgoMode}
                  onChange={() => setIsAlgoMode(!isAlgoMode)}
                />
                <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-green-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                <span className="ml-3 text-sm">Algorithmic</span>
              </label>
            </div>
          </div>
          
          <nav>
            <ul className="space-y-2">
              <li>
                <NavLink to="/" className={({isActive}) => 
                  `flex items-center p-3 rounded-lg ${isActive ? 'bg-gray-700 text-green-400' : 'hover:bg-gray-700'}`
                }>
                  <FaChartArea className="mr-3" /> Dashboard
                </NavLink>
              </li>
              <li>
                <NavLink to="/market-data" className={({isActive}) => 
                  `flex items-center p-3 rounded-lg ${isActive ? 'bg-gray-700 text-green-400' : 'hover:bg-gray-700'}`
                }>
                  <FaExchangeAlt className="mr-3" /> Market Data
                </NavLink>
              </li>
              <li>
                <NavLink to="/strategies" className={({isActive}) => 
                  `flex items-center p-3 rounded-lg ${isActive ? 'bg-gray-700 text-green-400' : 'hover:bg-gray-700'}`
                }>
                  <FaRobot className="mr-3" /> Strategy Creator
                </NavLink>
              </li>
              <li>
                <NavLink to="/backtest" className={({isActive}) => 
                  `flex items-center p-3 rounded-lg ${isActive ? 'bg-gray-700 text-green-400' : 'hover:bg-gray-700'}`
                }>
                  <FaHistory className="mr-3" /> Backtest Runner
                </NavLink>
              </li>
              <li>
                <NavLink to="/results" className={({isActive}) => 
                  `flex items-center p-3 rounded-lg ${isActive ? 'bg-gray-700 text-green-400' : 'hover:bg-gray-700'}`
                }>
                  <FaChartLine className="mr-3" /> Results
                </NavLink>
              </li>
              <li>
                <NavLink to="/library" className={({isActive}) => 
                  `flex items-center p-3 rounded-lg ${isActive ? 'bg-gray-700 text-green-400' : 'hover:bg-gray-700'}`
                }>
                  <FaBook className="mr-3" /> Strategy Library
                </NavLink>
              </li>
            </ul>
          </nav>
          
          <div className="mt-auto pt-10">
            <div className="p-3 rounded-lg bg-gray-700">
              <h3 className="text-sm font-medium">Mode: {isAlgoMode ? 'Algorithmic' : 'Manual'}</h3>
              <p className="text-xs text-gray-400 mt-1">
                {isAlgoMode 
                  ? 'Algorithmic trading enabled. Strategies active.' 
                  : 'Manual trading mode. Create and test strategies without auto-execution.'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard isAlgoMode={isAlgoMode} />} />
            <Route path="/market-data" element={<MarketDataViewer />} />
            <Route path="/strategies" element={<StrategyCreator />} />
            <Route path="/backtest" element={<BacktestRunner />} />
            <Route path="/results" element={<BacktestResults />} />
            <Route path="/library" element={<StrategyLibrary />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
