# AQUAPULSE Firmware Build & Test System

CC ?= gcc
CXX ?= g++
CFLAGS ?= -Wall -Wextra -O3 -Iinclude -Isrc
CXXFLAGS ?= -Wall -Wextra -O3 -std=c++17 -Iinclude -Isrc
LDFLAGS ?= -lm

SRCS_C = src/dma_dac_engine.c src/sensor_adc.c
SRCS_CXX = src/tinyml_policy.cpp src/main.cpp
OBJS = $(SRCS_C:.c=.o) $(SRCS_CXX:.cpp=.o)
TARGET = aquapulse_firmware_sim

TEST_SRCS = src/dma_dac_engine.c src/sensor_adc.c src/tinyml_policy.cpp tests/test_tinyml.cpp
TEST_TARGET = run_firmware_tests

all: $(TARGET)

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

%.o: %.cpp
	$(CXX) $(CXXFLAGS) -c $< -o $@

$(TARGET): $(OBJS)
	$(CXX) $(OBJS) -o $@ $(LDFLAGS)
	@echo "Build successful: ./$(TARGET)"

test: $(TEST_SRCS)
	$(CXX) $(CXXFLAGS) $(TEST_SRCS) -o $(TEST_TARGET) $(LDFLAGS)
	./$(TEST_TARGET)
	@rm -f $(TEST_TARGET)

clean:
	rm -f src/*.o tests/*.o $(TARGET) $(TEST_TARGET)

flash:
	@echo "Flashing to target MCU on $(PORT)..."
	@echo "Use 'pio run -t upload' or 'make flash PORT=/dev/ttyUSB0'"

.PHONY: all test clean flash
