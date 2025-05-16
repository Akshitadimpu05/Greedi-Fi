#include "StrategyEngine.h"
#include "SampleStrategies.h"
#include <iostream>
#include <thread>
#include <chrono>
#include <unordered_map>
#include <string>

int main(int argc, char* argv[]) {
    std::cout << "Greedi-Fi Strategy Engine Starting..." << std::endl;
    
    // Initialize the strategy engine
    GreediFi::StrategyEngine engine;
    
    // Register strategy templates
    std::cout << "Registering strategy templates..." << std::endl;
    engine.registerTemplate("moving_average_crossover", std::make_unique<GreediFi::MACrossoverTemplate>());
    engine.registerTemplate("rsi", std::make_unique<GreediFi::RSITemplate>());
    
    // Create some sample strategies for testing
    std::cout << "Creating sample strategies..." << std::endl;
    
    std::unordered_map<std::string, std::string> maParams = {
        {"short_period", "10"},
        {"long_period", "30"}
    };
    std::string maStrategyId = engine.createStrategy("moving_average_crossover", "MA Crossover 10/30", maParams);
    
    std::unordered_map<std::string, std::string> rsiParams = {
        {"period", "14"},
        {"oversold", "30"},
        {"overbought", "70"}
    };
    std::string rsiStrategyId = engine.createStrategy("rsi", "RSI Reversal Strategy", rsiParams);
    
    std::cout << "Strategy Engine started with " << engine.getActiveStrategies().size() << " active strategies" << std::endl;
    
    // In a real implementation, this would connect to the API server
    // For now, just keep the process running
    std::cout << "Strategy Engine running. Press Ctrl+C to exit." << std::endl;
    
    // Simulate some market data for strategy processing
    for (int i = 0; i < 10; ++i) {
        GreediFi::MarketData data;
        data.instrument = "BTC-USD";
        data.price = 45000.0 + (i * 100);
        data.volume = 10 + (i * 2);
        data.timestamp = "2025-05-16T12:30:00Z";
        
        std::cout << "Processing market data: " << data.instrument << " @ $" << data.price << std::endl;
        engine.processMarketData(data);
        
        std::this_thread::sleep_for(std::chrono::seconds(1));
    }
    
    // Run a simple backtest
    std::cout << "\nRunning sample backtest..." << std::endl;
    
    std::vector<GreediFi::MarketData> historicalData;
    // Create some historical data points
    for (int i = 0; i < 50; ++i) {
        GreediFi::MarketData data;
        data.instrument = "BTC-USD";
        data.price = 45000.0 + (i % 10) * 100 - 500 + (i / 10) * 200;
        data.volume = 10 + (i % 5) * 2;
        data.timestamp = "2025-05-16T12:" + std::to_string(i % 60) + ":00Z";
        historicalData.push_back(data);
    }
    
    std::vector<GreediFi::Position> initialPositions = {
        {
            "BTC-USD",  // instrument
            0.5,        // size
            44500.0,    // entry_price
            45000.0,    // current_price
            250.0       // unrealized_pnl
        }
    };
    
    auto results = engine.runBacktest(maStrategyId, historicalData, initialPositions);
    
    std::cout << "Backtest results for " << maStrategyId << ":" << std::endl;
    std::cout << "PnL points: " << results["pnl"].size() << std::endl;
    std::cout << "Final PnL: $" << results["pnl"].back() << std::endl;
    
    // Keep running until terminated
    while (true) {
        std::this_thread::sleep_for(std::chrono::seconds(1));
    }
    
    return 0;
}
