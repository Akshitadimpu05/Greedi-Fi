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

# Build and install redis-plus-plus with custom header structure
RUN git clone https://github.com/sewenew/redis-plus-plus.git && \
    cd redis-plus-plus && \
    mkdir build && cd build && \
    cmake -DREDIS_PLUS_PLUS_CXX_STANDARD=17 -DCMAKE_INSTALL_PREFIX=/usr/local .. && \
    make -j$(nproc) && \
    make install && \
    mkdir -p /usr/local/include/redis && \
    cp -r ../src/sw/redis++/*.h /usr/local/include/redis/ && \
    echo "#ifndef REDIS_CLIENT_H\n#define REDIS_CLIENT_H\n#include <sw/redis++/redis++.h>\nnamespace redis {\n    using client = sw::redis::Redis;\n}\n#endif" > /usr/local/include/redis/client.h && \
    ldconfig

# Set working directory for your app
WORKDIR /app
COPY . .

# Create build directory
RUN mkdir -p build

# Configure and build with full logging
RUN cd build && \
    cmake -DCMAKE_PREFIX_PATH=/usr/local -DCMAKE_INSTALL_PREFIX=/usr/local .. && \
    make VERBOSE=1 | tee /app/build.log && \
    # Find the built binaries recursively
    find . -name strategy_engine -o -name market_data_feed | tee /app/found_binaries.txt && \
    # Check if binaries were found
    if [ ! -s "/app/found_binaries.txt" ]; then \
      echo "❌ Build failed! Binaries not found!" && \
      echo "🔍 Contents of build.log:" && \
      cat /app/build.log && \
      echo "📄 CMakeCache.txt:" && \
      cat CMakeCache.txt && \
      echo "📁 Directory contents:" && \
      find . -type f -name "*.o" && \
      echo "CMake error output:" && \
      cat CMakeFiles/CMakeError.log || true && \
      exit 1; \
    fi

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

# Find and copy built binaries in a more reliable way
RUN mkdir -p /tmp/bin
COPY --from=builder /app/found_binaries.txt /tmp/bin/
COPY --from=builder /app/build /tmp/build/
RUN echo "Found binaries at:" && cat /tmp/bin/found_binaries.txt && \
    # Copy strategy_engine if it exists
    find /tmp/build -name strategy_engine -exec cp {} ./strategy_engine \; || echo "strategy_engine not found" && \
    # Copy market_data_feed if it exists
    find /tmp/build -name market_data_feed -exec cp {} ./market_data_feed \; || echo "market_data_feed not found" && \
    # Set executable permissions only on files that exist
    for bin in strategy_engine market_data_feed; do \
        if [ -f "./$bin" ]; then \
            chmod +x "./$bin"; \
            echo "Found $bin binary"; \
        else \
            echo "$bin binary not found"; \
        fi; \
    done && \
    # List all available binaries
    ls -la ./ || true

# Default run command
CMD ["./strategy_engine"]