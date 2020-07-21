var fillGradient = function(cv, img, delta=5) {
  let ch = img.channels();
  console.assert(!img.empty() && img.depth() == cv.CV_8U && ch <= 4);

  let n = 255 / delta;
  for(let r = 0; r < img.rows; ++r) {
    let kR = r % (2*n);
    let valR = (kR<=n) ? delta*kR : delta*(2*n-kR);
    for(let c = 0; c < img.cols; ++c) {
        let kC = c % (2*n);
        let valC = (kC<=n) ? delta*kC : delta*(2*n-kC);
        let vals = [valR, valC, 200*r/img.rows, 255];
        let p = img.ptr(r, c);
        for(let i = 0; i < ch; ++i) p[i] = vals[i];
    }
  }
}

var cvtStr2cvSize = function(strSize) {
  let size;

  let cvSize = getCvSize();
  switch(strSize) {
    case "127,61": size = cvSize.szODD;break;
    case '320,240': size = cvSize.szQVGA;break;
    case '640,480': size = cvSize.szVGA;break;
    case '960,540': size = cvSize.szqHD;break;
    case '1280,720': size = cvSize.sz720p;break;
    case '1920,1080': size = cvSize.sz1080p;break;
    case "130,60": size = cvSize.sz130x60;break;
    case '213,120': size = cvSize.sz213x120;break;
    default: console.error("unsupported size for this case");
  }
  return size;
}

var combine = function() {
  let result = [[]];
  for (let i = 0; i < arguments.length; ++i) {
    result = permute(result, arguments[i]);
  }
  return result;
}

function permute (source, target) {
  let result = [];
  for (let i = 0; i < source.length; ++i) {
    for (let j = 0; j < target.length; ++j) {
      let tmp = source[i].slice();
      tmp.push(target[j]);
      result.push(tmp);
    }
  }
  return result;
}

var constructMode = function (startStr, sChannel, dChannel) {
  let modeList = []
  for (let j in dChannel) {
    modeList.push(startStr+sChannel+"2"+dChannel[j])
  }
  return modeList;
}

var enableButton = function () {
  runButton.removeAttribute('disabled');
  runButton.setAttribute('class', 'btn btn-primary');
  runButton.innerHTML = 'Run';
}

var disableButton = function () {
  runButton.setAttribute("disabled", "disabled");
  runButton.setAttribute('class', 'btn btn-primary disabled');
  runButton.innerHTML = "Running";
}

var log = function (message) {
  console.log(message);
  if (!isNodeJs) {
    logElement.innerHTML += `\n${'\t' + message}`;
  }
}

var addKernelCase = function (suite, params, type, kernelFunc) {
  kernelFunc(suite, type);
  let index = suite.length - 1;
  suite[index].params = params;
}

function constructParamLog(params, kernel) {
  let paramLog = '';
  if (kernel == "cvtcolor") {
    let mode = params.mode;
    let size = params.size;
    console.log(size);
    paramLog = `params: (${parseInt(size[0])}x${parseInt(size[1])}, ${mode})`;
  } else if (kernel == "resize") {
    let matType = params.matType;
    let size1 = params.from;
    let size2 = params.to;
    paramLog = `params: (${matType},${parseInt(size1.width)}x${parseInt(size1.height)},`+
    `${parseInt(size2.width)}x${parseInt(size2.height)})`;
  } else if (kernel == "threshold") {
    let matSize = params.matSize;
    let matType = params.matType;
    let threshType = params.threshType;
    paramLog = `params: (${parseInt(matSize.width)}x${parseInt(matSize.height)},`+
    `${matType},${threshType})`
  }
  return paramLog;
}

var setBenchmarkSuite =  function (suite, kernel, currentCaseId) {
  suite
  // add listeners
  .on('cycle', function(event) {
    ++currentCaseId;
    let params = event.target.params;
    paramLog = constructParamLog(params, kernel);

    log(`=== ${event.target.name} ${currentCaseId} ===`);
    log(paramLog);
    log('elapsed time:' +String(event.target.times.elapsed*1000)+' ms');
    log('mean time:' +String(event.target.stats.mean*1000)+' ms');
    log('stddev time:' +String(event.target.stats.deviation*1000)+' ms');
    log(String(event.target));
  })
  .on('error', function(event) { log(`test case ${event.target.name} failed`); })
  .on('complete', function(event) {
    log(`\n ###################################`)
    log(`Finished testing ${event.currentTarget.length} cases \n`);
    if (!isNodeJs) {
      runButton.removeAttribute('disabled');
      runButton.setAttribute('class', 'btn btn-primary');
      runButton.innerHTML = 'Run';
    }
  });
}


if (typeof window === 'undefined') {
  exports.enableButton = enableButton;
  exports.disableButton = disableButton;
  exports.fillGradient = fillGradient;
  exports.cvtStr2cvSize = cvtStr2cvSize;
  exports.combine = combine;
  exports.constructMode = constructMode;
  exports.log = log;
  exports.setBenchmarkSuite = setBenchmarkSuite;
  exports.addKernelCase = addKernelCase;
}