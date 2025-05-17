cmake_minimum_required(VERSION 3.10)
project(GreediFi VERSION 0.1.0)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

# Enable verbose output during compilation
set(CMAKE_VERBOSE_MAKEFILE ON)

# Find Redis libraries
find_library(HIREDIS_LIB hiredis)
find_library(REDIS_PLUS_PLUS_LIB redis++)

# Find required packages
find_package(OpenSSL REQUIRED)
find_package(CURL REQUIRED)
find_package(Boost COMPONENTS system REQUIRED)
find_package(PkgConfig REQUIRED)
find_package(nlohmann_json 3.2.0 REQUIRED)
pkg_check_modules(LIBWEBSOCKETS REQUIRED libwebsockets)

# Print debug information
message(STATUS "Project source dir: ${CMAKE_CURRENT_SOURCE_DIR}")
message(STATUS "OpenSSL include dir: ${OPENSSL_INCLUDE_DIR}")
message(STATUS "CURL include dirs: ${CURL_INCLUDE_DIRS}")
message(STATUS "Boost include dirs: ${Boost_INCLUDE_DIRS}")
message(STATUS "Websockets include dirs: ${LIBWEBSOCKETS_INCLUDE_DIRS}")
message(STATUS "Redis libraries: ${HIREDIS_LIB} ${REDIS_PLUS_PLUS_LIB}")

# Set source files with explicit paths
set(STRATEGY_ENGINE_SOURCES
    ${CMAKE_CURRENT_SOURCE_DIR}/StrategyEngine.cpp
    ${CMAKE_CURRENT_SOURCE_DIR}/MarketDataFeed.cpp
    ${CMAKE_CURRENT_SOURCE_DIR}/main.cpp
)

set(MARKET_DATA_FEED_SOURCES
    ${CMAKE_CURRENT_SOURCE_DIR}/MarketDataFeed.cpp
    ${CMAKE_CURRENT_SOURCE_DIR}/main_market_data.cpp
)

# Print source files for debugging
message(STATUS "Strategy Engine sources: ${STRATEGY_ENGINE_SOURCES}")
message(STATUS "Market Data Feed sources: ${MARKET_DATA_FEED_SOURCES}")

# Add executable targets
add_executable(strategy_engine ${STRATEGY_ENGINE_SOURCES})
add_executable(market_data_feed ${MARKET_DATA_FEED_SOURCES})

# Common include directories
set(COMMON_INCLUDES
    ${CMAKE_CURRENT_SOURCE_DIR}
    ${OPENSSL_INCLUDE_DIR}
    ${CURL_INCLUDE_DIRS}
    ${Boost_INCLUDE_DIRS}
    ${LIBWEBSOCKETS_INCLUDE_DIRS}
)

# Common link libraries
set(COMMON_LIBS
    ${OPENSSL_LIBRARIES}
    ${CURL_LIBRARIES}
    ${Boost_LIBRARIES}
    ${LIBWEBSOCKETS_LIBRARIES}
    pthread
    nlohmann_json::nlohmann_json
    ${HIREDIS_LIB}
    ${REDIS_PLUS_PLUS_LIB}
)

# Common compiler flags
set(COMMON_FLAGS
    -Wall
    -Wextra
    -pedantic
    -O3
    -g
)

# Configure both targets
foreach(TARGET strategy_engine market_data_feed)
    target_include_directories(${TARGET} PRIVATE ${COMMON_INCLUDES})
    target_link_libraries(${TARGET} PRIVATE ${COMMON_LIBS})
    target_compile_options(${TARGET} PRIVATE ${COMMON_FLAGS})
endforeach()


# Print final configuration
message(STATUS "Configuration complete")