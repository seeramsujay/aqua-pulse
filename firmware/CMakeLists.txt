cmake_minimum_required(VERSION 3.16)
project(aquapulse_firmware LANGUAGES C CXX)

set(CMAKE_C_STANDARD 11)
set(CMAKE_CXX_STANDARD 17)

include_directories(include src)

set(SOURCES
    src/dma_dac_engine.c
    src/sensor_adc.c
    src/tinyml_policy.cpp
    src/main.cpp
)

add_executable(aquapulse_firmware ${SOURCES})
target_link_libraries(aquapulse_firmware m)
