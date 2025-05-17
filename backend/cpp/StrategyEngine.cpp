#include "StrategyEngine.h"
#include <iostream>
#include <chrono>
#include <sstream>
#include <iomanip>
#include <random>

namespace GreediFi {

StrategyEngine::StrategyEngine() {
    // Initialize any resources needed
    std::cout << "Strategy Engine initialized" << std::endl;
}

StrategyEngine::~StrategyEngine() {
    // Clean up resources
    templates_.clear();
    activeStrategies_.clear();
    std::cout << "Strategy Engine shutdown" << std::endl;
}

void StrategyEngine::registerTemplate(const std::string& name, std::unique_ptr<StrategyTemplate> templ) {
    templates_[name] = std::move(templ);
    std::cout << "Registered strategy template: " << name << std::endl;
}

std::string StrategyEngine::createStrategy(const std::string& templateName, const std::string& strategyName, 
                                         const std::unordered_map<std::string, std::string>& params) {
    // Generate a unique ID for the strategy
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_int_distribution<> distrib(10000, 99999);
    
    std::stringstream ss;
    ss << strategyName << "_" << distrib(gen);
    std::string strategyId = ss.str();
    
    auto it = templates_.find(templateName);
    if (it == templates_.end()) {
        std::cerr << "Strategy template not found: " << templateName << std::endl;
        return "";
    }
    
    // Create strategy from template
    auto strategy = it->second->createStrategy(strategyId, strategyName, params);
    if (!strategy) {
        std::cerr << "Failed to create strategy from template: " << templateName << std::endl;
        return "";
    }
    
    // Add to active strategies
    activeStrategies_[strategyId] = std::move(strategy);
    std::cout << "Created strategy: " << strategyId << " from template: " << templateName << std::endl;
    
    return strategyId;
}

bool StrategyEngine::removeStrategy(const std::string& strategyId) {
    auto it = activeStrategies_.find(strategyId);
    if (it == activeStrategies_.end()) {
        std::cerr << "Strategy not found: " << strategyId << std::endl;
        return false;
    }
    
    activeStrategies_.erase(it);
    std::cout << "Removed strategy: " << strategyId << std::endl;
    return true;
}

std::vector<std::string> StrategyEngine::getActiveStrategies() const {
    std::vector<std::string> result;
    for (const auto& pair : activeStrategies_) {
        result.push_back(pair.first);
    }
    return result;
}

void StrategyEngine::processMarketData(const MarketData& data) {
    // Forward market data to all active strategies
    for (auto& pair : activeStrategies_) {
        pair.second->onMarketData(data);
    }
}

void StrategyEngine::processTradeData(const TradeData& data) {
    // Forward trade data to all active strategies
    for (auto& pair : activeStrategies_) {
        pair.second->onTradeData(data);
    }
}

std::unordered_map<std::string, std::vector<double>> StrategyEngine::runBacktest(
    const std::string& strategyId, 
    const std::vector<MarketData>& historicalData,
    const std::vector<Position>& initialPositions) {
    
    auto it = activeStrategies_.find(strategyId);
    if (it == activeStrategies_.end()) {
        std::cerr << "Strategy not found for backtest: " << strategyId << std::endl;
        return {};
    }
    
    std::unordered_map<std::string, std::vector<double>> results;
    std::vector<Position> currentPositions = initialPositions;
    
    // Track PnL over time and other metrics
    std::vector<double> pnlHistory;
    pnlHistory.push_back(0.0); // Starting PnL
    
    for (const auto& data : historicalData) {
        // Process the market data point
        it->second->onMarketData(data);
        
        // Execute strategy and check if it wants to place an order
        if (it->second->executeStrategy(data, currentPositions)) {
            // In a real implementation, we would simulate order execution here
            // For now, we'll just update positions randomly to simulate trading
            
            // Update positions based on trading signals (simplified for example)
            double pnlChange = 0.0;
            for (auto& pos : currentPositions) {
                // Simple simulation of position changes based on price movement
                if (pos.instrument == data.instrument) {
                    double oldPnl = pos.unrealized_pnl;
                    pos.current_price = data.price;
                    pos.unrealized_pnl = (data.price - pos.entry_price) * pos.size;
                    pnlChange += (pos.unrealized_pnl - oldPnl);
                }
            }
            
            // Add to PnL history
            double lastPnl = pnlHistory.back();
            pnlHistory.push_back(lastPnl + pnlChange);
        }
    }
    
    // Store results
    results["pnl"] = pnlHistory;
    
    return results;
}

} // namespace GreediFi
