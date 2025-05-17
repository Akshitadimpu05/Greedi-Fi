#ifndef MARKET_DATA_FEED_H
#define MARKET_DATA_FEED_H

#include <string>
#include <vector>
#include <map>
#include <mutex>
#include <memory>
#include <functional>
#include <thread>
#include <atomic>

// Forward declaration
struct lws;
struct lws_context;

class MarketDataFeed {
public:
    // Market data types
    struct OrderBookEntry {
        double price;
        double amount;
    };

    struct OrderBook {
        std::vector<OrderBookEntry> bids;
        std::vector<OrderBookEntry> asks;
        std::string symbol;
        uint64_t timestamp;
    };

    struct Trade {
        double price;
        double amount;
        std::string side; // "buy" or "sell"
        uint64_t timestamp;
        std::string symbol;
    };

    // Constructor and destructor
    MarketDataFeed(const std::string& exchange, const std::string& symbol);
    ~MarketDataFeed();

    // Start and stop WebSocket connection
    bool connect();
    void disconnect();
    bool isConnected() const;

    // Get latest market data
    OrderBook getOrderBook() const;
    std::vector<Trade> getRecentTrades(int count = 10) const;
    
    // Callback for data updates
    using OrderBookCallback = std::function<void(const OrderBook&)>;
    using TradeCallback = std::function<void(const Trade&)>;
    
    // Register callbacks for updates
    void setOrderBookCallback(OrderBookCallback callback);
    void setTradeCallback(TradeCallback callback);

private:
    // Exchange and symbol details
    std::string exchange_;
    std::string symbol_;
    std::string wss_url_;
    std::string subscription_msg_;
    
    // WebSocket variables
    std::atomic<bool> running_;
    std::thread ws_thread_;
    struct lws_context* context_;
    
    // Market data storage
    mutable std::mutex order_book_mutex_;
    OrderBook order_book_;
    
    mutable std::mutex trades_mutex_;
    std::vector<Trade> recent_trades_;
    
    // Callbacks
    OrderBookCallback order_book_callback_;
    TradeCallback trade_callback_;
    
    // WebSocket callback handlers
    static int ws_callback(struct lws* wsi, enum lws_callback_reasons reason,
                          void* user, void* in, size_t len);
    
    // JSON parsing methods
    void processMessage(const std::string& message);
    void updateOrderBook(const std::string& data);
    void addTrade(const Trade& trade);
    
    // Initialize WebSocket context
    bool initWebSocketContext();
};

#endif // MARKET_DATA_FEED_H
