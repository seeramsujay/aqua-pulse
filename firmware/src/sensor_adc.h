/**
 * @file sensor_adc.h
 * @brief 4-Channel Environmental ADC Sensor Acquisition Driver
 */

#ifndef SENSOR_ADC_H
#define SENSOR_ADC_H

#include "../include/config.h"
#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
    uint16_t raw_adc[ADC_NUM_CHANNELS];
    float    turbidity_ntu;
    float    salinity_psu;
    float    temperature_c;
    float    depth_m;
    float    battery_v;
    float    sound_speed_mps; /* Computed via Mackenzie (1981) formula */
} OceanSensorData_t;

/**
 * @brief Initialize ADC DMA peripheral for continuous sensor sampling.
 */
void sensor_adc_init(void);

/**
 * @brief Read and filter current environmental sensor parameters.
 */
void sensor_adc_read(OceanSensorData_t* out_data);

/**
 * @brief Compute speed of sound using Mackenzie (1981) 9-term equation.
 * c(T, S, z) = 1449.2 + 4.6T - 0.055T^2 + 0.00029T^3 + (1.34 - 0.010T)(S - 35) + 0.0163z
 */
float compute_mackenzie_sound_speed(float temp_c, float salinity_psu, float depth_m);

#ifdef __cplusplus
}
#endif

#endif /* SENSOR_ADC_H */

/* EOF: firmware/src/sensor_adc.h */
