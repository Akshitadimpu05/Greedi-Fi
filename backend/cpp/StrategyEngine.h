#pragma once

#include <string>
#include <vector>
#include <unordered_map>
#include <memory>
#include <functional>

namespace GreediFi {

struct MarketData {
    std::string instrument;
    double price;
    double volume;
    std::string timestamp;
    // Additional market data fields can be added here
};

struct TradeData {
    std::string id;
    std::string instrument;
    double price;
    double size;
    std::string side; // "buy" or "sell"
    std::string timestamp;
    std::string order_id;
    // Additional trade data fields
};

struct Position {
    std::string instrument;
    double size;
    double entry_price;
    double current_price;
    double unrealized_pnl;
    // Additional position data
};

class Strategy {
public:
    Strategy(const std::string& id, const std::string& name) 
        : id_(id), name_(name) {}
    
    virtual ~Strategy() = default;
    
    virtual void onMarketData(const MarketData& data) = 0;
    virtual void onTradeData(const TradeData& data) = 0;
    
    // This method should be implemented by strategies to execute trading logic
    // Return value indicates whether an order should be placed
    virtual bool executeStrategy(const MarketData& marketData, const std::vector<Position>& positions) = 0;
    
    // Getters
    std::string getId() const { return id_; }
    std::string getName() const { return name_; }

protected:
    std::string id_;
    std::string name_;
};

// Base class for strategy templates
class StrategyTemplate {
public:
    virtual std::unique_ptr<Strategy> createStrategy(const std::string& id, const std::string& name, 
                                                    const std::unordered_map<std::string, std::string>& params) = 0;
    virtual ~StrategyTemplate() = default;
};

// Strategy engine that manages all strategies
class StrategyEngine {
public:
    StrategyEngine();
    ~StrategyEngine();
    
    // Register a strategy template
    void registerTemplate(const std::string& name, std::unique_ptr<StrategyTemplate> templ);
    
    // Create a new strategy instance from a template
    std::string createStrategy(const std::string& templateName, const std::string& strategyName, 
                             const std::unordered_map<std::string, std::string>& params);
    
    // Remove a strategy
    bool removeStrategy(const std::string& strategyId);
    
    // Get all active strategies
    std::vector<std::string> getActiveStrategies() const;
    
    // Process market data update
    void processMarketData(const MarketData& data);
    
    // Process trade data update
    void processTradeData(const TradeData& data);
    
    // Run strategy backtest
    std::unordered_map<std::string, std::vector<double>> runBacktest(
        const std::string& strategyId, 
        const std::vector<MarketData>& historicalData,
        const std::vector<Position>& initialPositions);
    
private:
    std::unordered_map<std::string, std::unique_ptr<StrategyTemplate>> templates_;
    std::unordered_map<std::string, std::unique_ptr<Strategy>> activeStrategies_;
};

} // namespace GreediFi
