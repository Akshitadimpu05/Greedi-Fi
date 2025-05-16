cmake_minimum_required(VERSION 3.10)
project(GreediFi VERSION 0.1.0)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Find required packages
find_package(OpenSSL REQUIRED)
find_package(CURL REQUIRED)
find_package(Boost COMPONENTS system REQUIRED)

# Set source files
set(SOURCES
    StrategyEngine.cpp
    main.cpp
)

# Add executable target
add_executable(strategy_engine ${SOURCES})

# Include directories
target_include_directories(strategy_engine PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}
    ${OPENSSL_INCLUDE_DIR}
    ${CURL_INCLUDE_DIRS}
    ${Boost_INCLUDE_DIRS}
)

# Link libraries
target_link_libraries(strategy_engine PRIVATE
    ${OPENSSL_LIBRARIES}
    ${CURL_LIBRARIES}
    ${Boost_LIBRARIES}
    pthread
)

# Set compiler flags
target_compile_options(strategy_engine PRIVATE
    -Wall
    -Wextra
    -pedantic
    -O3
)
