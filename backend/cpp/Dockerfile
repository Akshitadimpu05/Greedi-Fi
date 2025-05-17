# ---------- Build Stage ----------
FROM gcc:11 AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    cmake \
    git \
    build-essential \
    libboost-system-dev \
    libboost-filesystem-dev \
    libboost-program-options-dev \
    libboost-thread-dev \
    libboost-date-time-dev \
    libboost-test-dev \
    libssl-dev \
    libcurl4-openssl-dev \
    libwebsockets-dev \
    pkg-config \
    nlohmann-json3-dev \
    && rm -rf /var/lib/apt/lists/*

# Build and install hiredis
WORKDIR /tmp
RUN git clone https://github.com/redis/hiredis.git && \
    cd hiredis && \
    make -j$(nproc) && \
    make install && \
    ldconfig

# Build and install redis-plus-plus
RUN git clone https://github.com/sewenew/redis-plus-plus.git && \
    cd redis-plus-plus && \
    mkdir build && cd build && \
    cmake -DREDIS_PLUS_PLUS_CXX_STANDARD=17 -DCMAKE_INSTALL_PREFIX=/usr/local .. && \
    make -j$(nproc) && \
    make install && \
    ldconfig

# Set working directory for your app
WORKDIR /app
COPY . .

# Create build directory
RUN mkdir -p build

# Configure and build with full logging
RUN cd build && \
    cmake -DCMAKE_PREFIX_PATH=/usr/local .. && \
    cmake --build . -- VERBOSE=1 || \
    (echo "❌ Build failed!" && \
     echo "📄 CMakeCache.txt:" && \
     cat CMakeCache.txt && \
     echo "📁 Directory contents:" && \
     ls -la .. && \
     exit 1)

# Verify the binaries were built
RUN ls -la build/
    
# ---------- Runtime Stage ----------
FROM debian:bullseye-slim

# Install runtime dependencies (updated SSL version)
RUN apt-get update && apt-get install -y \
    libboost-system1.74.0 \
    libcurl4 \
    libssl1.1 \
    libwebsockets16 \
    && rm -rf /var/lib/apt/lists/*

# Copy Redis libraries
COPY --from=builder /usr/local/lib/libhiredis* /usr/local/lib/
COPY --from=builder /usr/local/lib/libredis++* /usr/local/lib/
RUN ldconfig

# Set up working directory
WORKDIR /app

# Copy built binaries
COPY --from=builder /app/build/strategy_engine .
COPY --from=builder /app/build/market_data_feed .

# Default run command
CMD ["./strategy_engine"]