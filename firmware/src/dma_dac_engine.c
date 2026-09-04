/**
 * @file dma_dac_engine.c
 * @brief Tier 2: Zero-CPU DMA-Driven Wave Engine Implementation
 */

#include "dma_dac_engine.h"
#include <math.h>
#include <string.h>

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

static DmaDacEngine_t g_dma_engine;

void dma_dac_engine_init(void) {
    memset(&g_dma_engine, 0, sizeof(DmaDacEngine_t));
    g_dma_engine.active_buffer_idx = 0;
    g_dma_engine.is_transmitting = false;

    /* Fill initial buffer with quiescent midpoint (1.65V) */
    for (int b = 0; b < PING_PONG_BUFFER_COUNT; b++) {
        for (int i = 0; i < DMA_STREAM_BUFFER_SIZE; i++) {
            g_dma_engine.buffer[b][i] = DAC_MIDPOINT_VALUE;
        }
    }

    /*
     * Hardware initialization:
     * 1. On STM32: Configure TIM6 TRGO update event to trigger DAC1_CH1 DMA stream.
     * 2. On ESP32-S3: Configure General Purpose Timer Group 0 and I2S/LCD DMA bus.
     */
}

uint16_t dma_dac_synthesize_chirp(
    uint16_t* buffer,
    float f_start_hz,
    float f_end_hz,
    float duration_ms,
    WindowType_t window_type,
    float amplitude_norm
) {
    if (!buffer) return 0;

    float duration_sec = duration_ms / 1000.0f;
    uint32_t num_samples = (uint32_t)(duration_sec * SAMPLING_RATE_HZ);
    if (num_samples > DMA_STREAM_BUFFER_SIZE) {
        num_samples = DMA_STREAM_BUFFER_SIZE;
    }

    float chirp_rate_k = (f_end_hz - f_start_hz) / duration_sec;
    float dt = 1.0f / (float)SAMPLING_RATE_HZ;
    float peak_amp = DAC_MAX_AMPLITUDE * amplitude_norm;

    for (uint32_t n = 0; n < num_samples; n++) {
        float t = (float)n * dt;
        
        /* Instantaneous phase phi(t) = 2*pi * (f0*t + 0.5 * k * t^2) */
        float phase = 2.0f * (float)M_PI * (f_start_hz * t + 0.5f * chirp_rate_k * t * t);
        float raw_wave = sinf(phase);

        /* Apply Digital Window Envelope */
        float window_val = 1.0f;
        float norm_idx = (float)n / (float)(num_samples - 1);

        if (window_type == WINDOW_HANN) {
            /* Hann Window: 0.5 * (1 - cos(2*pi*n / (N-1))) */
            window_val = 0.5f * (1.0f - cosf(2.0f * (float)M_PI * norm_idx));
        } else if (window_type == WINDOW_BLACKMAN_HARRIS) {
            /* 4-term 92dB Sidelobe Suppression Blackman-Harris */
            float a0 = 0.35875f;
            float a1 = 0.48829f;
            float a2 = 0.14128f;
            float a3 = 0.01168f;
            window_val = a0 
                       - a1 * cosf(2.0f * (float)M_PI * norm_idx)
                       + a2 * cosf(4.0f * (float)M_PI * norm_idx)
                       - a3 * cosf(6.0f * (float)M_PI * norm_idx);
        }

        /* 12-bit Scaled Sample with Midpoint Offset */
        float sample_val = (float)DAC_MIDPOINT_VALUE + (raw_wave * window_val * peak_amp);
        
        /* Clamp to 12-bit range [0, 4095] */
        if (sample_val < 0.0f) sample_val = 0.0f;
        if (sample_val > 4095.0f) sample_val = 4095.0f;

        buffer[n] = (uint16_t)sample_val;
    }

    /* Quiescent trailing pad */
    for (uint32_t n = num_samples; n < DMA_STREAM_BUFFER_SIZE; n++) {
        buffer[n] = DAC_MIDPOINT_VALUE;
    }

    return (uint16_t)num_samples;
}

uint16_t dma_dac_synthesize_hfm_chirp(
    uint16_t* buffer,
    float f_start_hz,
    float f_end_hz,
    float duration_ms,
    float amplitude_norm
) {
    float duration_sec = duration_ms / 1000.0f;
    uint32_t num_samples = (uint32_t)(duration_sec * SAMPLING_RATE_HZ);
    if (num_samples > DMA_STREAM_BUFFER_SIZE) num_samples = DMA_STREAM_BUFFER_SIZE;

    float dt = 1.0f / (float)SAMPLING_RATE_HZ;
    float peak_amp = DAC_MAX_AMPLITUDE * amplitude_norm;
    float phase = 0.0f;

    for (uint32_t n = 0; n < num_samples; n++) {
        float t = (float)n * dt;
        /* Hyperbolic instantaneous frequency law: f(t) = f0*f1 / (f1 - (f1 - f0)*(t / Tp)) */
        float denom = f_end_hz - (f_end_hz - f_start_hz) * (t / duration_sec);
        if (fabsf(denom) < 1.0f) denom = 1.0f;
        float f_inst = (f_start_hz * f_end_hz) / denom;
        phase += 2.0f * (float)M_PI * f_inst * dt;

        /* Hann window envelope for HFM */
        float norm_idx = (float)n / (float)(num_samples > 1 ? num_samples - 1 : 1);
        float window_val = 0.5f * (1.0f - cosf(2.0f * (float)M_PI * norm_idx));

        float sample_val = (float)DAC_MIDPOINT_VALUE + (sinf(phase) * window_val * peak_amp);
        if (sample_val < 0.0f) sample_val = 0.0f;
        if (sample_val > 4095.0f) sample_val = 4095.0f;

        buffer[n] = (uint16_t)sample_val;
    }

    for (uint32_t n = num_samples; n < DMA_STREAM_BUFFER_SIZE; n++) {
        buffer[n] = DAC_MIDPOINT_VALUE;
    }

    return (uint16_t)num_samples;
}

void dma_dac_trigger_ping(uint8_t channel_idx, WindowType_t window, float amplitude) {
    if (channel_idx >= NUM_CHIRP_CHANNELS) {
        channel_idx = 0;
    }

    const ChirpChannelConfig_t* cfg = &CHIRP_CHANNELS[channel_idx];
    uint8_t next_buf_idx = (g_dma_engine.active_buffer_idx + 1) % PING_PONG_BUFFER_COUNT;

    /* Synthesize into back-buffer (HFM vs LFM) */
    if (window == WINDOW_HFM) {
        g_dma_engine.active_sample_count = dma_dac_synthesize_hfm_chirp(
            g_dma_engine.buffer[next_buf_idx],
            cfg->f_start_hz,
            cfg->f_end_hz,
            cfg->duration_ms,
            amplitude
        );
    } else {
        g_dma_engine.active_sample_count = dma_dac_synthesize_chirp(
            g_dma_engine.buffer[next_buf_idx],
            cfg->f_start_hz,
            cfg->f_end_hz,
            cfg->duration_ms,
            window,
            amplitude
        );
    }

    /* Swap buffers and trigger DMA burst */
    g_dma_engine.active_buffer_idx = next_buf_idx;
    g_dma_engine.is_transmitting = true;
    g_dma_engine.total_pings_transmitted++;

    /* In real hardware, start DMA Stream:
     * HAL_DAC_Start_DMA(&hdac1, DAC_CHANNEL_1, (uint32_t*)g_dma_engine.buffer[next_buf_idx], g_dma_engine.active_sample_count, DAC_ALIGN_12B_R);
     */
}

bool dma_dac_is_busy(void) {
    return g_dma_engine.is_transmitting;
}

void dma_dac_stop(void) {
    g_dma_engine.is_transmitting = false;
}

/* EOF: firmware/src/dma_dac_engine.c */
