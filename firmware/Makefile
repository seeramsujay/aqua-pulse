# AQUAPULSE Firmware Build System

CC ?= gcc
CXX ?= g++
CFLAGS ?= -Wall -Wextra -O3 -Iinclude -Isrc
CXXFLAGS ?= -Wall -Wextra -O3 -std=c++17 -Iinclude -Isrc
LDFLAGS ?= -lm

SRCS_C = src/dma_dac_engine.c src/sensor_adc.c
SRCS_CXX = src/tinyml_policy.cpp src/main.cpp
OBJS = $(SRCS_C:.c=.o) $(SRCS_CXX:.cpp=.o)
TARGET = aquapulse_firmware_sim

all: $(TARGET)

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

%.o: %.cpp
	$(CXX) $(CXXFLAGS) -c $< -o $@

$(TARGET): $(OBJS)
	$(CXX) $(OBJS) -o $@ $(LDFLAGS)
	@echo "Build successful: ./$(TARGET)"

clean:
	rm -f src/*.o $(TARGET)

flash:
	@echo "Flashing to target MCU on $(PORT)..."
	@echo "Use 'pio run -t upload' or 'make flash PORT=/dev/ttyUSB0'"

.PHONY: all clean flash
