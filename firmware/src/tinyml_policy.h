/**
 * @file tinyml_policy.h
 * @brief Tier 3: Quantized INT8 TinyML MLP Policy Engine & 1D-CNN Echo Classifier
 */

#ifndef TINYML_POLICY_H
#define TINYML_POLICY_H

#include "../include/config.h"
#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
    float turbidity_ntu;
    float salinity_psu;
    float temperature_c;
    float depth_m;
    float battery_v;
} TinyMLInput_t;

typedef struct {
    uint8_t      recommended_channel_id; /* 0, 1, or 2 */
    WindowType_t recommended_window;     /* Hann, Blackman-Harris */
    float        recommended_amplitude;  /* 0.1 to 1.0 */
    float        estimated_snr_db;
    float        predicted_power_mw;
    float        power_savings_pct;      /* Compared to static 100% 45kHz CW */
    uint32_t     inference_time_us;      /* Microseconds */
} TinyMLOutput_t;

/**
 * @brief Initialize the quantized INT8 neural network weights & tensors in SRAM.
 */
void tinyml_policy_init(void);

/**
 * @brief Run fast quantized INT8 inference (<1.2 ms) to compute optimal chirp parameters.
 * 
 * @param input Environmental sensor inputs
 * @param output Output control tuple
 */
void tinyml_policy_infer(const TinyMLInput_t* input, TinyMLOutput_t* output);

/**
 * @brief 1D-CNN synthetic echo classifier to identify acoustic boundary interactions.
 * 
 * @param echo_samples Array of digitized ADC return samples
 * @param num_samples Number of samples (e.g. 64 or 128)
 * @return EchoClass_t Classified return type
 */
EchoClass_t tinyml_classify_echo(const float* echo_samples, uint16_t num_samples);

#ifdef __cplusplus
}
#endif

#endif /* TINYML_POLICY_H */

/* EOF: firmware/src/tinyml_policy.h */
