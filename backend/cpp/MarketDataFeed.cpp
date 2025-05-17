#include "MarketDataFeed.h"
#include <libwebsockets.h>
#include <nlohmann/json.hpp>
#include <iostream>
#include <sstream>
#include <algorithm>
#include <cstring>

using json = nlohmann::json;

// Per-session data for WebSocket connection
struct PerSessionData {
    MarketDataFeed* instance;
    std::string rx_buffer;
};

// Static instance mapping for callback
std::map<struct lws*, MarketDataFeed*> g_instance_map;

MarketDataFeed::MarketDataFeed(const std::string& exchange, const std::string& symbol)
    : exchange_(exchange), symbol_(symbol), running_(false) {
    
    // Initialize empty order book
    order_book_.symbol = symbol;
    order_book_.timestamp = 0;
    
    // Set up WebSocket URL and subscription message based on exchange
    if (exchange == "deribit") {
        wss_url_ = "test.deribit.com";
        // Format subscription message for Deribit
        std::stringstream ss;
        ss << "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"public/subscribe\",\"params\":{\"channels\":[\"book." 
           << symbol << ".100ms\",\"trades." << symbol << ".100ms\"]}}";
        subscription_msg_ = ss.str();
    } else if (exchange == "bitmex") {
        wss_url_ = "testnet.bitmex.com";
        // Format subscription message for BitMEX
        std::stringstream ss;
        ss << "{\"op\":\"subscribe\",\"args\":[\"orderBook10:" << symbol << "\",\"trade:" << symbol << "\"]}";
        subscription_msg_ = ss.str();
    } else {
        std::cerr << "Unsupported exchange: " << exchange << std::endl;
        wss_url_ = "";
        subscription_msg_ = "";
    }
}

MarketDataFeed::~MarketDataFeed() {
    disconnect();
}

bool MarketDataFeed::connect() {
    if (running_) {
        return true; // Already running
    }
    
    if (wss_url_.empty() || subscription_msg_.empty()) {
        return false;
    }
    
    if (!initWebSocketContext()) {
        return false;
    }
    
    running_ = true;
    ws_thread_ = std::thread([this]() {
        while (running_) {
            lws_service(context_, 100);
        }
        lws_context_destroy(context_);
    });
    
    return true;
}

void MarketDataFeed::disconnect() {
    if (!running_) {
        return;
    }
    
    running_ = false;
    if (ws_thread_.joinable()) {
        ws_thread_.join();
    }
}

bool MarketDataFeed::isConnected() const {
    return running_;
}

MarketDataFeed::OrderBook MarketDataFeed::getOrderBook() const {
    std::lock_guard<std::mutex> lock(order_book_mutex_);
    return order_book_;
}

std::vector<MarketDataFeed::Trade> MarketDataFeed::getRecentTrades(int count) const {
    std::lock_guard<std::mutex> lock(trades_mutex_);
    
    std::vector<Trade> result;
    result.reserve(std::min(count, static_cast<int>(recent_trades_.size())));
    
    // Return the most recent trades first
    auto start_it = recent_trades_.size() <= count ? 
                    recent_trades_.begin() : 
                    recent_trades_.end() - count;
                    
    result.assign(start_it, recent_trades_.end());
    return result;
}

void MarketDataFeed::setOrderBookCallback(OrderBookCallback callback) {
    order_book_callback_ = callback;
}

void MarketDataFeed::setTradeCallback(TradeCallback callback) {
    trade_callback_ = callback;
}

bool MarketDataFeed::initWebSocketContext() {
    lws_context_creation_info info;
    memset(&info, 0, sizeof(info));
    
    info.port = CONTEXT_PORT_NO_LISTEN;
    info.protocols = new lws_protocols[2];
    
    // Setup protocols
    info.protocols[0].name = "market-data";
    info.protocols[0].callback = MarketDataFeed::ws_callback;
    info.protocols[0].per_session_data_size = sizeof(PerSessionData);
    info.protocols[0].rx_buffer_size = 65536;
    
    // Null terminating protocol
    info.protocols[1].name = nullptr;
    info.protocols[1].callback = nullptr;
    info.protocols[1].per_session_data_size = 0;
    
    info.options = LWS_SERVER_OPTION_DO_SSL_GLOBAL_INIT;
    info.gid = -1;
    info.uid = -1;
    
    context_ = lws_create_context(&info);
    delete[] info.protocols;
    
    if (!context_) {
        std::cerr << "Failed to create WebSocket context" << std::endl;
        return false;
    }
    
    struct lws_client_connect_info ccinfo;
    memset(&ccinfo, 0, sizeof(ccinfo));
    
    ccinfo.context = context_;
    ccinfo.address = wss_url_.c_str();
    ccinfo.port = 443;
    ccinfo.path = "/ws";
    ccinfo.host = wss_url_.c_str();
    ccinfo.origin = wss_url_.c_str();
    ccinfo.protocol = "market-data";
    ccinfo.ssl_connection = LCCSCF_USE_SSL | LCCSCF_ALLOW_SELFSIGNED;
    ccinfo.userdata = this;
    
    struct lws* wsi = lws_client_connect_via_info(&ccinfo);
    if (!wsi) {
        std::cerr << "Failed to connect to WebSocket server" << std::endl;
        lws_context_destroy(context_);
        return false;
    }
    
    g_instance_map[wsi] = this;
    return true;
}

int MarketDataFeed::ws_callback(struct lws* wsi, enum lws_callback_reasons reason,
                               void* user, void* in, size_t len) {
    PerSessionData* pss = static_cast<PerSessionData*>(user);
    
    switch (reason) {
        case LWS_CALLBACK_CLIENT_ESTABLISHED: {
            std::cout << "WebSocket connection established" << std::endl;
            pss->instance = g_instance_map[wsi];
            
            // Send subscription message
            unsigned char buf[LWS_PRE + 2048];
            size_t n = sprintf((char*)&buf[LWS_PRE], "%s", pss->instance->subscription_msg_.c_str());
            lws_write(wsi, &buf[LWS_PRE], n, LWS_WRITE_TEXT);
            break;
        }
        
        case LWS_CALLBACK_CLIENT_RECEIVE: {
            // Append incoming data to buffer
            const char* data = static_cast<const char*>(in);
            pss->rx_buffer.append(data, len);
            
            // Check if we have a complete message (assuming all messages end with newline or are self-contained)
            if (len < 4 || (data[len-2] == '\r' && data[len-1] == '\n')) {
                pss->instance->processMessage(pss->rx_buffer);
                pss->rx_buffer.clear();
            }
            break;
        }
        
        case LWS_CALLBACK_CLIENT_CLOSED:
            std::cout << "WebSocket connection closed" << std::endl;
            g_instance_map.erase(wsi);
            break;
            
        default:
            break;
    }
    
    return 0;
}

void MarketDataFeed::processMessage(const std::string& message) {
    try {
        // Parse the message as JSON
        json j = json::parse(message);
        
        if (exchange_ == "deribit") {
            // Process Deribit message format
            if (j.contains("params") && j["params"].contains("data")) {
                auto& data = j["params"]["data"];
                
                // Handle order book updates
                if (j["params"].contains("channel") && 
                    j["params"]["channel"].get<std::string>().find("book.") == 0) {
                    std::lock_guard<std::mutex> lock(order_book_mutex_);
                    
                    order_book_.timestamp = data["timestamp"].get<uint64_t>();
                    
                    // Update bids
                    order_book_.bids.clear();
                    for (const auto& bid : data["bids"]) {
                        OrderBookEntry entry;
                        entry.price = bid[0].get<double>();
                        entry.amount = bid[1].get<double>();
                        order_book_.bids.push_back(entry);
                    }
                    
                    // Update asks
                    order_book_.asks.clear();
                    for (const auto& ask : data["asks"]) {
                        OrderBookEntry entry;
                        entry.price = ask[0].get<double>();
                        entry.amount = ask[1].get<double>();
                        order_book_.asks.push_back(entry);
                    }
                    
                    // Call callback if registered
                    if (order_book_callback_) {
                        order_book_callback_(order_book_);
                    }
                } 
                // Handle trade updates
                else if (j["params"].contains("channel") && 
                         j["params"]["channel"].get<std::string>().find("trades.") == 0) {
                    Trade trade;
                    trade.price = data["price"].get<double>();
                    trade.amount = data["amount"].get<double>();
                    trade.side = data["direction"].get<std::string>();
                    trade.timestamp = data["timestamp"].get<uint64_t>();
                    trade.symbol = symbol_;
                    
                    addTrade(trade);
                    
                    // Call callback if registered
                    if (trade_callback_) {
                        trade_callback_(trade);
                    }
                }
            }
        } 
        else if (exchange_ == "bitmex") {
            // Process BitMEX message format
            if (j.contains("table")) {
                const std::string& table = j["table"].get<std::string>();
                
                // Handle order book updates
                if (table == "orderBook10" && j.contains("data") && !j["data"].empty()) {
                    auto& data = j["data"][0];
                    
                    std::lock_guard<std::mutex> lock(order_book_mutex_);
                    
                    order_book_.timestamp = data["timestamp"].get<uint64_t>();
                    
                    // Update bids
                    order_book_.bids.clear();
                    for (const auto& bid : data["bids"]) {
                        OrderBookEntry entry;
                        entry.price = bid[0].get<double>();
                        entry.amount = bid[1].get<double>();
                        order_book_.bids.push_back(entry);
                    }
                    
                    // Update asks
                    order_book_.asks.clear();
                    for (const auto& ask : data["asks"]) {
                        OrderBookEntry entry;
                        entry.price = ask[0].get<double>();
                        entry.amount = ask[1].get<double>();
                        order_book_.asks.push_back(entry);
                    }
                    
                    // Call callback if registered
                    if (order_book_callback_) {
                        order_book_callback_(order_book_);
                    }
                } 
                // Handle trade updates
                else if (table == "trade" && j.contains("data")) {
                    for (const auto& t : j["data"]) {
                        Trade trade;
                        trade.price = t["price"].get<double>();
                        trade.amount = t["size"].get<double>();
                        trade.side = t["side"].get<std::string>();
                        trade.timestamp = t["timestamp"].get<uint64_t>();
                        trade.symbol = symbol_;
                        
                        addTrade(trade);
                        
                        // Call callback if registered
                        if (trade_callback_) {
                            trade_callback_(trade);
                        }
                    }
                }
            }
        }
    } catch (const std::exception& e) {
        std::cerr << "Error processing WebSocket message: " << e.what() << std::endl;
        std::cerr << "Message: " << message << std::endl;
    }
}

void MarketDataFeed::addTrade(const Trade& trade) {
    std::lock_guard<std::mutex> lock(trades_mutex_);
    
    // Add trade to recent trades, keeping a maximum of 100 trades
    recent_trades_.push_back(trade);
    if (recent_trades_.size() > 100) {
        recent_trades_.erase(recent_trades_.begin());
    }
}
