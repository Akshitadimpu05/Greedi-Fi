#pragma once

#include "StrategyEngine.h"
#include <string>
#include <vector>
#include <deque>

namespace GreediFi {

// Moving Average Crossover Strategy
class MovingAverageCrossoverStrategy : public Strategy {
public:
    MovingAverageCrossoverStrategy(const std::string& id, const std::string& name, 
                                 int shortPeriod, int longPeriod)
        : Strategy(id, name), 
          shortPeriod_(shortPeriod), 
          longPeriod_(longPeriod),
          lastSignal_("none") {}
    
    void onMarketData(const MarketData& data) override {
        // Store price data
        if (data.price > 0) {
            prices_.push_back(data.price);
            timestamps_.push_back(data.timestamp);
            
            // Keep only necessary data points
            while (prices_.size() > static_cast<size_t>(longPeriod_ * 2)) {
                prices_.pop_front();
                timestamps_.pop_front();
            }
        }
    }
    
    void onTradeData(const TradeData& data) override {
        // Track trades for this strategy (if needed)
    }
    
    bool executeStrategy(const MarketData& marketData, const std::vector<Position>& positions) override {
        if (prices_.size() < static_cast<size_t>(longPeriod_)) {
            // Not enough data to make decisions
            return false;
        }
        
        // Calculate short and long moving averages
        double shortMA = calculateMA(shortPeriod_);
        double longMA = calculateMA(longPeriod_);
        
        // Generate trading signals
        std::string signal = "none";
        
        if (shortMA > longMA && lastSignal_ != "buy") {
            signal = "buy";
        } else if (shortMA < longMA && lastSignal_ != "sell") {
            signal = "sell";
        }
        
        // Update last signal
        if (signal != "none") {
            lastSignal_ = signal;
            return true; // Signal to place an order
        }
        
        return false;
    }
    
private:
    int shortPeriod_;
    int longPeriod_;
    std::deque<double> prices_;
    std::deque<std::string> timestamps_;
    std::string lastSignal_;
    
    double calculateMA(int period) {
        if (prices_.size() < static_cast<size_t>(period)) {
            return 0.0;
        }
        
        double sum = 0.0;
        for (int i = prices_.size() - 1; i >= static_cast<int>(prices_.size() - period); --i) {
            sum += prices_[i];
        }
        
        return sum / period;
    }
};

// Template for creating Moving Average Crossover Strategy
class MACrossoverTemplate : public StrategyTemplate {
public:
    std::unique_ptr<Strategy> createStrategy(const std::string& id, const std::string& name, 
                                          const std::unordered_map<std::string, std::string>& params) override {
        // Default values
        int shortPeriod = 10;
        int longPeriod = 30;
        
        // Parse parameters
        auto it = params.find("short_period");
        if (it != params.end()) {
            try {
                shortPeriod = std::stoi(it->second);
            } catch (...) {
                std::cerr << "Invalid short_period parameter: " << it->second << std::endl;
            }
        }
        
        it = params.find("long_period");
        if (it != params.end()) {
            try {
                longPeriod = std::stoi(it->second);
            } catch (...) {
                std::cerr << "Invalid long_period parameter: " << it->second << std::endl;
            }
        }
        
        // Create and return strategy
        return std::make_unique<MovingAverageCrossoverStrategy>(id, name, shortPeriod, longPeriod);
    }
};

// RSI Strategy - Relative Strength Index
class RSIStrategy : public Strategy {
public:
    RSIStrategy(const std::string& id, const std::string& name, 
               int period, double oversoldThreshold, double overboughtThreshold)
        : Strategy(id, name), 
          period_(period), 
          oversoldThreshold_(oversoldThreshold),
          overboughtThreshold_(overboughtThreshold),
          lastSignal_("none") {}
    
    void onMarketData(const MarketData& data) override {
        // Store price data
        if (data.price > 0) {
            prices_.push_back(data.price);
            timestamps_.push_back(data.timestamp);
            
            // Keep only necessary data points
            while (prices_.size() > static_cast<size_t>(period_ * 3)) {
                prices_.pop_front();
                timestamps_.pop_front();
            }
        }
    }
    
    void onTradeData(const TradeData& data) override {
        // Track trades if needed
    }
    
    bool executeStrategy(const MarketData& marketData, const std::vector<Position>& positions) override {
        if (prices_.size() < static_cast<size_t>(period_ + 1)) {
            // Not enough data to calculate RSI
            return false;
        }
        
        // Calculate RSI
        double rsi = calculateRSI();
        
        // Generate trading signals
        std::string signal = "none";
        
        if (rsi < oversoldThreshold_ && lastSignal_ != "buy") {
            signal = "buy"; // Oversold condition
        } else if (rsi > overboughtThreshold_ && lastSignal_ != "sell") {
            signal = "sell"; // Overbought condition
        }
        
        // Update last signal
        if (signal != "none") {
            lastSignal_ = signal;
            return true; // Signal to place an order
        }
        
        return false;
    }
    
private:
    int period_;
    double oversoldThreshold_;
    double overboughtThreshold_;
    std::deque<double> prices_;
    std::deque<std::string> timestamps_;
    std::string lastSignal_;
    
    double calculateRSI() {
        if (prices_.size() < static_cast<size_t>(period_ + 1)) {
            return 50.0; // Neutral RSI when not enough data
        }
        
        double gainSum = 0.0;
        double lossSum = 0.0;
        
        // Calculate gains and losses
        for (size_t i = prices_.size() - period_; i < prices_.size(); ++i) {
            double change = prices_[i] - prices_[i-1];
            if (change > 0) {
                gainSum += change;
            } else {
                lossSum -= change; // Convert to positive
            }
        }
        
        // Average gain and loss
        double avgGain = gainSum / period_;
        double avgLoss = lossSum / period_;
        
        // Calculate RSI
        if (avgLoss == 0.0) {
            return 100.0; // No losses
        }
        
        double rs = avgGain / avgLoss;
        return 100.0 - (100.0 / (1.0 + rs));
    }
};

// Template for creating RSI Strategy
class RSITemplate : public StrategyTemplate {
public:
    std::unique_ptr<Strategy> createStrategy(const std::string& id, const std::string& name, 
                                          const std::unordered_map<std::string, std::string>& params) override {
        // Default values
        int period = 14;
        double oversoldThreshold = 30.0;
        double overboughtThreshold = 70.0;
        
        // Parse parameters
        auto it = params.find("period");
        if (it != params.end()) {
            try {
                period = std::stoi(it->second);
            } catch (...) {
                std::cerr << "Invalid period parameter: " << it->second << std::endl;
            }
        }
        
        it = params.find("oversold");
        if (it != params.end()) {
            try {
                oversoldThreshold = std::stod(it->second);
            } catch (...) {
                std::cerr << "Invalid oversold parameter: " << it->second << std::endl;
            }
        }
        
        it = params.find("overbought");
        if (it != params.end()) {
            try {
                overboughtThreshold = std::stod(it->second);
            } catch (...) {
                std::cerr << "Invalid overbought parameter: " << it->second << std::endl;
            }
        }
        
        // Create and return strategy
        return std::make_unique<RSIStrategy>(id, name, period, oversoldThreshold, overboughtThreshold);
    }
};

} // namespace GreediFi
