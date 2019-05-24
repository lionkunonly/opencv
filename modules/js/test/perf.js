function standardDeviation(values){
  var avg = average(values);
  
  var squareDiffs = values.map(function(value){
    var diff = value - avg;
    var sqrDiff = diff * diff;
    return sqrDiff;
  });
  
  var avgSquareDiff = average(squareDiffs);

  var stdDev = Math.sqrt(avgSquareDiff);
  return stdDev;
}

function average(data){
  var sum = data.reduce(function(sum, value){
    return sum + value;
  }, 0);

  var avg = sum / data.length;
  return avg;
}

function getMs(hrtime) {
  return hrtime[0]*1000 + hrtime[1]/1000000;
}

function printResult(elapsed, perf) {
  console.log(`elapsed time: ${getMs(elapsed)}`);
  console.log(`average time: ${average(perf)}`);
  console.log(`stddev: ${standardDeviation(perf)} (${(standardDeviation(perf)/average(perf)*100).toFixed(2)}%)`);
}

const samples = 1000;

var cv = require('./opencv.js');

cv.onRuntimeInitialized = () => {
  console.log('opencv.js loaded');
  perfCvtColor();
  perfThreshold();
  perfGaussianBlur();
  perfIntegral();
};

function perfCvtColor() {
  let source = new cv.Mat(640, 480, cv.CV_8UC4);
  let dest = new cv.Mat();

  console.log(`=== cvtColor ===`);
  let perf = [];
  const start = process.hrtime();
  for (let i = 0; i < samples; ++i) {
    let hrstart = process.hrtime();
    cv.cvtColor(source, dest, cv.COLOR_BGR2GRAY, 0);
    let hrend = process.hrtime(hrstart);
    perf.push(getMs(hrend));
  }
  const elapsed = process.hrtime(start);
  printResult(elapsed, perf);

  source.delete();
  dest.delete();
}

function perfThreshold() {
  const THRESHOLD = 127.0;
  const THRESHOLD_MAX = 210.0;
  let source = new cv.Mat(640, 480, cv.CV_8UC1);
  let sourceView = source.data;
  sourceView[0] = 0; // < threshold
  sourceView[1] = 100; // < threshold
  sourceView[2] = 200; // > threshold

  let dest = new cv.Mat();

  console.log(`=== threshold ===`);
  let perf = [];
  let start = process.hrtime();
  for (let i = 0; i < samples; ++i) {
    let hrstart = process.hrtime();
    cv.threshold(source, dest, THRESHOLD, THRESHOLD_MAX, cv.THRESH_BINARY);
    let hrend = process.hrtime(hrstart);
    perf.push(getMs(hrend));
  }
  const elapsed = process.hrtime(start);
  printResult(elapsed, perf);

  source.delete();
  dest.delete();
}

function perfGaussianBlur() {
  let mat1 = cv.Mat.ones(640, 480, cv.CV_8UC4);
  let mat2 = new cv.Mat();

  console.log(`=== GaussianBlur ===`);
  let perf = [];
  let start = process.hrtime();
  for (let i = 0; i < samples; ++i) {
    let hrstart = process.hrtime();
    cv.GaussianBlur(mat1, mat2, new cv.Size(3, 3), 0, 0, // eslint-disable-line new-cap
                    cv.BORDER_CONSTANT);
    let hrend = process.hrtime(hrstart);
    perf.push(getMs(hrend));
  }
  const elapsed = process.hrtime(start);
  printResult(elapsed, perf);
  
  mat1.delete();
  mat2.delete();
}

function perfIntegral() {
  let mat = cv.Mat.eye({height: 640, width: 480}, cv.CV_8UC1);
  let sum = new cv.Mat();
  let sqSum = new cv.Mat();
  console.log(`=== integral ===`);
  let perf = [];
  let start = process.hrtime();
  for (let i = 0; i < samples; ++i) {
    let hrstart = process.hrtime();
    cv.integral2(mat, sum, sqSum, -1, -1);
    let hrend = process.hrtime(hrstart);
    perf.push(getMs(hrend));
  }
  const elapsed = process.hrtime(start);
  printResult(elapsed, perf);

  mat.delete();
  sum.delete();
  sqSum.delete();
}