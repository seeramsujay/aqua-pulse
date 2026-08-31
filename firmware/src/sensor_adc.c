/**
 * @file sensor_adc.c
 * @brief Environmental Sensor ADC Driver Implementation
 */

#include "sensor_adc.h"
#include <string.h>

#define FILTER_ALPHA 0.15f /* Exponential Moving Average Smoothing */

static OceanSensorData_t g_current_sensors;

void sensor_adc_init(void) {
    memset(&g_current_sensors, 0, sizeof(OceanSensorData_t));
    g_current_sensors.temperature_c = 18.0f;
    g_current_sensors.salinity_psu = 35.0f;
    g_current_sensors.turbidity_ntu = 12.0f;
    g_current_sensors.depth_m = 100.0f;
    g_current_sensors.battery_v = 12.6f;
    g_current_sensors.sound_speed_mps = compute_mackenzie_sound_speed(18.0f, 35.0f, 100.0f);
}

float compute_mackenzie_sound_speed(float T, float S, float z) {
    /* Mackenzie (1981) formula:
     * c = 1449.2 + 4.6T - 0.055T^2 + 0.00029T^3 + (1.34 - 0.010T)(S - 35) + 0.0163z
     */
    float t2 = T * T;
    float t3 = t2 * T;
    float c = 1449.2f + 4.6f * T - 0.055f * t2 + 0.00029f * t3 + (1.34f - 0.010f * T) * (S - 35.0f) + 0.0163f * z;
    return c;
}

void sensor_adc_read(OceanSensorData_t* out_data) {
    if (!out_data) return;

    /*
     * In real hardware: Read 12-bit ADC DMA circular buffer values.
     * Scale raw counts [0, 4095] to physical engineering units:
     * 
     * Turbidity: 0 - 1000 NTU (TS-300B analog turbidity sensor)
     * Salinity: 0 - 45 PSU (Conductivity / Refractometer probe)
     * Temperature: -2 to 35 °C (PT1000 RTD sensor)
     * Depth: 0 - 2000 m (Keller 7LD Piezoresistive pressure transmitter)
     * Battery: 9.0V - 14.8V (4S Li-Ion voltage divider 100k/33k)
     */
    
    /* Update speed of sound */
    g_current_sensors.sound_speed_mps = compute_mackenzie_sound_speed(
        g_current_sensors.temperature_c,
        g_current_sensors.salinity_psu,
        g_current_sensors.depth_m
    );

    memcpy(out_data, &g_current_sensors, sizeof(OceanSensorData_t));
}

/* EOF: firmware/src/sensor_adc.c */
