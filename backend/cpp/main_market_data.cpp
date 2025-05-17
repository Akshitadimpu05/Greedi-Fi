#include "MarketDataFeed.h"
#include <iostream>
#include <string>
#include <csignal>
#include <thread>
#include <chrono>
#include <cstring>
#include <redis/client.h>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

// Global variables for signal handling
volatile sig_atomic_t running = 1;

// Signal handler for graceful shutdown
void signalHandler(int signum) {
    std::cout << "Received signal " << signum << std::endl;
    running = 0;
}

// Convert OrderBook to JSON
json orderBookToJson(const MarketDataFeed::OrderBook& book) {
    json j;
    j["symbol"] = book.symbol;
    j["timestamp"] = book.timestamp;
    
    j["bids"] = json::array();
    for (const auto& bid : book.bids) {
        json entry;
        entry.push_back(bid.price);
        entry.push_back(bid.amount);
        j["bids"].push_back(entry);
    }
    
    j["asks"] = json::array();
    for (const auto& ask : book.asks) {
        json entry;
        entry.push_back(ask.price);
        entry.push_back(ask.amount);
        j["asks"].push_back(entry);
    }
    
    return j;
}

// Convert Trade to JSON
json tradeToJson(const MarketDataFeed::Trade& trade) {
    json j;
    j["symbol"] = trade.symbol;
    j["timestamp"] = trade.timestamp;
    j["price"] = trade.price;
    j["amount"] = trade.amount;
    j["side"] = trade.side;
    return j;
}

int main(int argc, char* argv[]) {
    // Set up signal handlers
    signal(SIGINT, signalHandler);
    signal(SIGTERM, signalHandler);
    
    // Default values
    std::string exchange = "deribit";
    std::string symbol = "BTC-PERPETUAL";
    std::string redis_host = "redis";
    int redis_port = 6379;
    
    // Parse command line arguments
    for (int i = 1; i < argc; i++) {
        if (strcmp(argv[i], "--exchange") == 0 && i + 1 < argc) {
            exchange = argv[i + 1];
            i++;
        } else if (strcmp(argv[i], "--symbol") == 0 && i + 1 < argc) {
            symbol = argv[i + 1];
            i++;
        } else if (strcmp(argv[i], "--redis-host") == 0 && i + 1 < argc) {
            redis_host = argv[i + 1];
            i++;
        } else if (strcmp(argv[i], "--redis-port") == 0 && i + 1 < argc) {
            redis_port = std::stoi(argv[i + 1]);
            i++;
        } else if (strcmp(argv[i], "--help") == 0) {
            std::cout << "Usage: " << argv[0] << " [OPTIONS]" << std::endl;
            std::cout << "Options:" << std::endl;
            std::cout << "  --exchange EXCHANGE   Exchange name (default: deribit)" << std::endl;
            std::cout << "  --symbol SYMBOL       Symbol to subscribe (default: BTC-PERPETUAL)" << std::endl;
            std::cout << "  --redis-host HOST     Redis host (default: redis)" << std::endl;
            std::cout << "  --redis-port PORT     Redis port (default: 6379)" << std::endl;
            std::cout << "  --help                Show this help message" << std::endl;
            return 0;
        }
    }
    
    std::cout << "Starting market data feed for " << exchange << " " << symbol << std::endl;
    std::cout << "Using Redis at " << redis_host << ":" << redis_port << std::endl;
    
    // Initialize Redis client
    auto redis = std::make_shared<redis::client>(redis_host + ":" + std::to_string(redis_port));
    
    try {
        // Initialize market data feed
        MarketDataFeed feed(exchange, symbol);
        
        // Set up callbacks
        feed.setOrderBookCallback([&redis, &symbol](const MarketDataFeed::OrderBook& book) {
            // Convert to JSON and publish to Redis
            json j = orderBookToJson(book);
            std::string message = j.dump();
            
            // Publish to orderbook channel
            redis->publish("orderbook:" + symbol, message);
        });
        
        feed.setTradeCallback([&redis, &symbol](const MarketDataFeed::Trade& trade) {
            // Convert to JSON and publish to Redis
            json j = tradeToJson(trade);
            std::string message = j.dump();
            
            // Publish to trades channel
            redis->publish("trades:" + symbol, message);
        });
        
        // Connect to exchange
        if (!feed.connect()) {
            std::cerr << "Failed to connect to exchange" << std::endl;
            return 1;
        }
        
        std::cout << "Connected to exchange, waiting for market data..." << std::endl;
        
        // Main loop
        while (running) {
            std::this_thread::sleep_for(std::chrono::seconds(1));
            
            // Periodically publish the full order book for new clients
            auto book = feed.getOrderBook();
            json j = orderBookToJson(book);
            redis->set("orderbook_snapshot:" + symbol, j.dump());
        }
        
        // Disconnect from exchange
        feed.disconnect();
        std::cout << "Disconnected from exchange" << std::endl;
        
    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << std::endl;
        return 1;
    }
    
    return 0;
}
