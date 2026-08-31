/**
 * @file dma_dac_engine.h
 * @brief Tier 2: Zero-CPU DMA-Driven Wave Engine & DAC Lookup Table Generator
 */

#ifndef DMA_DAC_ENGINE_H
#define DMA_DAC_ENGINE_H

#include "../include/config.h"
#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
    uint16_t buffer[PING_PONG_BUFFER_COUNT][DMA_STREAM_BUFFER_SIZE];
    volatile uint8_t active_buffer_idx;
    volatile bool is_transmitting;
    uint16_t active_sample_count;
    uint32_t total_pings_transmitted;
} DmaDacEngine_t;

/**
 * @brief Initialize the hardware timer TRGO and DAC DMA circular stream.
 */
void dma_dac_engine_init(void);

/**
 * @brief Synthesize a Linear Frequency Modulated (LFM) chirp waveform with windowing into SRAM buffer.
 * 
 * f(t) = f0 + (B / Tp) * t
 * phase(t) = 2*pi * (f0*t + 0.5 * (B / Tp) * t^2)
 * 
 * @param buffer Pointer to target 12-bit DAC sample buffer
 * @param f_start_hz Start frequency (Hz)
 * @param f_end_hz End frequency (Hz)
 * @param duration_ms Pulse duration (ms)
 * @param window_type Windowing profile (Rectangular, Hann, Blackman-Harris)
 * @param amplitude_norm Normalized peak amplitude (0.0 to 1.0)
 * @return uint16_t Number of samples synthesized
 */
uint16_t dma_dac_synthesize_chirp(
    uint16_t* buffer,
    float f_start_hz,
    float f_end_hz,
    float duration_ms,
    WindowType_t window_type,
    float amplitude_norm
);

/**
 * @brief Trigger a non-blocking DMA transmission burst.
 * Hardware Timer automatically clocks DAC samples out at 2.4 MSPS with 0.0% CPU overhead.
 */
void dma_dac_trigger_ping(uint8_t channel_idx, WindowType_t window, float amplitude);

/**
 * @brief Check if active transmission is in progress.
 */
bool dma_dac_is_busy(void);

/**
 * @brief Stop active transmission immediately and reset DAC to midpoint (1.65V).
 */
void dma_dac_stop(void);

#ifdef __cplusplus
}
#endif

#endif /* DMA_DAC_ENGINE_H */

/* EOF: firmware/src/dma_dac_engine.h */
