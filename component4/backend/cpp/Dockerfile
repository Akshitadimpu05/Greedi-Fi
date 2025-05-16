FROM gcc:11 as builder

# Install dependencies
RUN apt-get update && apt-get install -y \
    cmake \
    libboost-all-dev \
    libssl-dev \
    libcurl4-openssl-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/src

# Copy C++ source files
COPY . .

# Create build directory
RUN mkdir -p /app/build

WORKDIR /app/build

# Build the C++ code
RUN cmake ../src && \
    make -j$(nproc)

# Use a smaller image for the final container
FROM debian:bullseye-slim

RUN apt-get update && apt-get install -y \
    libboost-system1.74.0 \
    libcurl4 \
    libssl1.1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the built executables from the builder stage
COPY --from=builder /app/build/strategy_engine .

# Set the entry point
ENTRYPOINT ["./strategy_engine"]
