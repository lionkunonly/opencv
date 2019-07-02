# Opencv.js Benchmark

## Prerequisites

1. node.js, npm: Make sure you have installed these beforehand with the system package manager.

2. Benchmark.js: Make sure you have installed Benchmark.js by npm before use.

## How to Use

For example, if you want to test the performance of cvtColor, please run `perf_cvtcolor.js` by node in terminal:

```sh
node per_cvtcolor.js
```

All tests of cvtColor will be run by above command.

If you just want to run one specific case, please use `--test_param_filter="()"` flag, like:

```sh
node per_cvtcolor.js --test_param_filter="(1920x1080, COLOR_BGR2GRAY)"
```
