function errorLog(log) {
    console.log(log);
}

var openCVLoader = async function (binPath, onloadCallback) {
    OPENCV_URL = "opecv.js"
    let simdSupported = await wasmFeatureDetect.simd();
    let trSupported = await wasmFeatureDetect.threads();

    if (simdSupported && trSupported) {
        OPENCV_URL = binPath + "build_mt_simd/opencv.js"
    } else if (simdSupported) {
        OPENCV_URL = binPath + "build_simd/opencv.js"
    } else if (trSupported) {
        OPENCV_URL = binPath + "build_mt/opencv.js"
    } else {
        OPENCV_URL = binPath + "build_wasm/opencv.js"
    }

    let script = document.createElement('script');
    script.setAttribute('async', '');
    script.setAttribute('type', 'text/javascript');
    script.addEventListener('load', () => {
        onloadCallback();
    });
    script.addEventListener('error', () => {
        errorLog('Failed to load' + OPENCV_URL);
    });
    script.src = OPENCV_URL;
    let node = document.getElementsByTagName('script')[0];
    node.parentNode.insertBefore(script, node);
}
