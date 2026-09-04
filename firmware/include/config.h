/**
 * @file config.h
 * @brief AQUAPULSE: System Configuration, Pinouts & Embedded Helper Macros
 * 
 * Target Microcontrollers: STM32H743ZI / ESP32-S3 (Dual-Core Xtensa LX7)
 * SIH26058 MoES/NIOT Cognitive Acoustic Sonar Payload
 */

#ifndef AQUAPULSE_CONFIG_H
#define AQUAPULSE_CONFIG_H

#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

/* =========================================================================
 * 0. AQUAPULSE PROTOCOL FRAMING & EOF MACROS
 * ========================================================================= */
#define AQUA_PACKET_SOF             0xAA55AA55UL  /* Start of Frame (SOF) */
#define AQUA_PACKET_EOF             0x55AA55AAUL  /* End of Frame / Packet (EOF) */
#define AQUA_STREAM_EOF_BYTE        0xFE          /* Stream End of Transmission (EOT) */
#define AQUA_DMA_BUFFER_EOF_VAL     0x0FFF        /* 12-bit Sentinel EOF sample */

/* Packet Validation Macros */
#define AQUA_VERIFY_SOF(pkt)        ((pkt)->sof_marker == AQUA_PACKET_SOF)
#define AQUA_VERIFY_EOF(pkt)        ((pkt)->eof_marker == AQUA_PACKET_EOF)
#define AQUA_IS_PACKET_VALID(pkt)   (AQUA_VERIFY_SOF(pkt) && AQUA_VERIFY_EOF(pkt))

/* Utility & Math Helper Macros */
#define AQUA_ARRAY_SIZE(arr)        (sizeof(arr) / sizeof((arr)[0]))
#define AQUA_CLAMP(val, low, high)  (((val) < (low)) ? (low) : (((val) > (high)) ? (high) : (val)))
#define AQUA_MIN(a, b)              (((a) < (b)) ? (a) : (b))
#define AQUA_MAX(a, b)              (((a) > (b)) ? (a) : (b))

/* Unit Conversion Macros */
#define AQUA_KHZ_TO_HZ(khz)         ((float)(khz) * 1000.0f)
#define AQUA_HZ_TO_KHZ(hz)          ((float)(hz) / 1000.0f)
#define AQUA_MS_TO_SEC(ms)          ((float)(ms) / 1000.0f)
#define AQUA_SEC_TO_MS(s)           ((float)(s) * 1000.0f)
#define AQUA_MS_TO_SAMPLES(ms, fs)  ((uint32_t)(((float)(ms) / 1000.0f) * (float)(fs)))
#define AQUA_SAMPLES_TO_MS(n, fs)   (((float)(n) / (float)(fs)) * 1000.0f)

/* INT8 Neural Quantization Macros */
#define AQUA_QUANTIZE_INT8(val, min_v, max_v) \
    ((int8_t)(AQUA_CLAMP(((val) - (min_v)) / ((max_v) - (min_v)), 0.0f, 1.0f) * 254.0f - 127.0f))

#define AQUA_DEQUANTIZE_INT8(q_val, min_v, max_v) \
    ((((float)(q_val) + 127.0f) / 254.0f) * ((max_v) - (min_v)) + (min_v))

/* =========================================================================
 * 1. CLOCK & SAMPLING CONFIGURATION
 * ========================================================================= */
#define SAMPLING_RATE_HZ            2400000UL   /* 2.4 MSPS DAC Trigger Rate (TRGO) */
#define TIMER_BASE_FREQ_HZ          240000000UL /* 240 MHz Timer Base Clock */
#define TIMER_PRESCALER             1           /* Prescaler = 1 */
#define TIMER_PERIOD_TICKS          100         /* Period = 100 ticks -> 2.4 MHz TRGO */

#define DAC_RESOLUTION_BITS         12          /* 12-bit DAC: 0 to 4095 */
#define DAC_MIDPOINT_VALUE          2048        /* 1.65V DC Offset for 3.3V Rail */
#define DAC_MAX_AMPLITUDE           2040        /* Peak amplitude to prevent rail clipping */

/* =========================================================================
 * 2. DMA & BUFFER ALLOCATION (Zero-CPU SRAM)
 * ========================================================================= */
#define MAX_CHIRP_SAMPLES           3600        /* 1.5 ms @ 2.4 MSPS = 3600 samples */
#define PING_PONG_BUFFER_COUNT      2
#define DMA_STREAM_BUFFER_SIZE      MAX_CHIRP_SAMPLES

/* =========================================================================
 * 3. STEPPED MULTI-TONE CHIRP CHANNELS
 * ========================================================================= */
#define NUM_CHIRP_CHANNELS          3

typedef struct {
    uint8_t     channel_id;
    float       f_start_hz;     /* Start Frequency (Hz) */
    float       f_end_hz;       /* End Frequency (Hz) */
    float       bandwidth_hz;   /* Bandwidth B (Hz) */
    float       duration_ms;    /* Pulse Duration Tp (ms) */
    uint16_t    num_samples;    /* Total samples in buffer */
    const char* description;
} ChirpChannelConfig_t;

/* Channel 0: Deep Turbid Water Penetration (100 - 140 kHz, B = 40 kHz, Tp = 1.2 ms)
 * Channel 1: Mid-Water Halocline Profiling (200 - 250 kHz, B = 50 kHz, Tp = 0.8 ms)
 * Channel 2: High-Resolution Bathymetry    (400 - 480 kHz, B = 80 kHz, Tp = 0.5 ms)
 */
static const ChirpChannelConfig_t CHIRP_CHANNELS[NUM_CHIRP_CHANNELS] = {
    {0, 100000.0f, 140000.0f, 40000.0f, 1.2f, 2880, "Ch0: Deep Turbidity Penetration (100-140 kHz)"},
    {1, 200000.0f, 250000.0f, 50000.0f, 0.8f, 1920, "Ch1: Mid-Water Halocline (200-250 kHz)"},
    {2, 400000.0f, 480000.0f, 80000.0f, 0.5f, 1200, "Ch2: High-Definition Bathymetry (400-480 kHz)"}
};

/* =========================================================================
 * 4. WINDOWING FUNCTIONS
 * ========================================================================= */
typedef enum {
    WINDOW_RECTANGULAR = 0,
    WINDOW_HANN = 1,
    WINDOW_BLACKMAN_HARRIS = 2,
    WINDOW_HFM = 4
} WindowType_t;

/* =========================================================================
 * 5. ENVIRONMENTAL ADC SENSOR CHANNELS
 * ========================================================================= */
#define ADC_CHANNEL_TURBIDITY       0   /* NTU (0 - 1000 NTU) */
#define ADC_CHANNEL_SALINITY        1   /* PSU (0 - 42 PSU) */
#define ADC_CHANNEL_TEMPERATURE     2   /* deg C (-2 to +35 deg C) */
#define ADC_CHANNEL_DEPTH           3   /* Hydrostatic Depth (0 - 2000 m) */
#define ADC_CHANNEL_BATTERY_V       4   /* Battery Voltage Monitor (9.0V - 14.8V) */
#define ADC_NUM_CHANNELS            5

/* =========================================================================
 * 6. TELEMETRY & SERIAL BRIDGE
 * ========================================================================= */
#define TELEMETRY_BAUD_RATE         115200
#define TELEMETRY_QUEUE_LENGTH      16

/* =========================================================================
 * 7. ECHO CLASSIFICATION LABELS
 * ========================================================================= */
typedef enum {
    ECHO_SPECULAR_SEABED = 0,
    ECHO_DIFFUSE_TURBIDITY = 1,
    ECHO_MULTIPATH_STRATA = 2,
    ECHO_SHADOW_ZONE_LOST = 3
} EchoClass_t;

/* =========================================================================
 * 8. TELEMETRY DATA PACKET FORMAT (Framed with SOF and EOF)
 * ========================================================================= */
typedef struct __attribute__((packed)) {
    uint32_t sof_marker;             /* Must equal AQUA_PACKET_SOF */
    uint32_t timestamp_ms;
    uint8_t  channel_id;
    float    f_start_hz;
    float    f_end_hz;
    float    duration_ms;
    uint8_t  window_type;
    float    amplitude_norm;         /* 0.0 to 1.0 */
    
    /* Sensor telemetry */
    float    turbidity_ntu;
    float    salinity_psu;
    float    temperature_c;
    float    depth_m;
    float    battery_v;
    float    sound_speed_mps;
    
    /* Acoustic & Power Metrics */
    float    active_power_mw;
    float    energy_saved_pct;
    float    snr_db;
    uint8_t  echo_classification;
    float    estimated_bottom_depth_m;
    
    uint32_t eof_marker;             /* Must equal AQUA_PACKET_EOF */
} SonarTelemetryPacket_t;

#ifdef __cplusplus
}
#endif

#endif /* AQUAPULSE_CONFIG_H */

/* EOF: firmware/include/config.h */
