# AQUAPULSE Firmware Subsystem

Bare-metal C/C++ firmware targeting **STM32H7** or **ESP32-S3** microcontrollers running FreeRTOS.

## Core Responsibilities
1. **Tier 2 - Bare-Metal Wave Engine (Core 0):**
   - 32-bit hardware timer (TIM6) triggering at 2.4 MSPS.
   - Circular DMA streaming pushing windowed SRAM lookup tables to DAC with **0.0% CPU overhead**.
   - Digital windowing: Real-time Hann and Blackman-Harris tapering.

2. **Tier 3 - Cognitive Adaptation & Echo Classification (Core 1):**
   - 4-Channel ADC sensor acquisition (Turbidity, Salinity, Depth, Temperature).
   - INT8 quantized Multi-Layer Perceptron (MLP) running on TensorFlow Lite for Microcontrollers (<1.2 ms inference latency).
   - 1D-CNN synthetic echo classification for closed-loop adaptation.

## Directory Structure
- `main.c` / `main.cpp`: FreeRTOS task initialization and dual-core pinning.
- `dma_dac_engine.c`: Hardware timer, DMA stream, and digital windowing lookup tables.
- `tinyml_policy.cpp`: TFLite Micro INT8 model weights and inference harness.
- `sensor_adc.c`: 4-channel environmental ADC reader.
