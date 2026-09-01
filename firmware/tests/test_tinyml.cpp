/**
 * @file test_tinyml.cpp
 * @brief Unit tests for embedded INT8 TinyML policy and SOF/EOF packet framing.
 */

#include "../include/config.h"
#include "../src/tinyml_policy.h"
#include "../src/sensor_adc.h"

#include <stdio.h>
#include <assert.h>
#include <math.h>

void test_quantization_macros() {
    float val = 400.0f;
    int8_t q = AQUA_QUANTIZE_INT8(val, 0.0f, 800.0f);
    assert(q >= -5 && q <= 5); // 0.5 normalized -> ~0 INT8
    printf("[PASS] INT8 Quantization Macro Test Passed.\n");
}

void test_packet_framing() {
    SonarTelemetryPacket_t pkt;
    pkt.sof_marker = AQUA_PACKET_SOF;
    pkt.eof_marker = AQUA_PACKET_EOF;
    assert(AQUA_IS_PACKET_VALID(&pkt));

    pkt.eof_marker = 0x12345678;
    assert(!AQUA_IS_PACKET_VALID(&pkt));
    printf("[PASS] Packet SOF/EOF Framing Validation Passed.\n");
}

void test_tinyml_inference_turbid() {
    tinyml_policy_init();

    TinyMLInput_t turbid_input = {
        .turbidity_ntu = 450.0f,
        .salinity_psu = 35.0f,
        .temperature_c = 15.0f,
        .depth_m = 300.0f,
        .battery_v = 12.2f
    };

    TinyMLOutput_t out;
    tinyml_policy_infer(&turbid_input, &out);

    // Severe turbidity must trigger Channel 0 (100-140 kHz) and Blackman-Harris window
    assert(out.recommended_channel_id == 0);
    assert(out.recommended_window == WINDOW_BLACKMAN_HARRIS);
    assert(out.inference_time_us < 1200); // Latency < 1.2 ms
    printf("[PASS] TinyML Turbid Channel Selection Test Passed (Inference: %lu us).\n", (unsigned long)out.inference_time_us);
}

void test_tinyml_inference_clear_shallow() {
    TinyMLInput_t clear_input = {
        .turbidity_ntu = 8.0f,
        .salinity_psu = 35.0f,
        .temperature_c = 22.0f,
        .depth_m = 50.0f,
        .battery_v = 12.6f
    };

    TinyMLOutput_t out;
    tinyml_policy_infer(&clear_input, &out);

    // Clear shallow water must trigger Channel 2 (400-480 kHz)
    assert(out.recommended_channel_id == 2);
    printf("[PASS] TinyML Clear Shallow Channel Selection Test Passed.\n");
}

int main(void) {
    printf("\n=== Running AQUAPULSE Firmware Unit Tests ===\n");
    test_quantization_macros();
    test_packet_framing();
    test_tinyml_inference_turbid();
    test_tinyml_inference_clear_shallow();
    printf("=== ALL 4 FIRMWARE UNIT TESTS PASSED ===\n\n");
    return 0;
}

/* EOF: firmware/tests/test_tinyml.cpp */
