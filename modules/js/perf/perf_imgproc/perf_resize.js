const isNodeJs = (typeof window) === 'undefined'? true : false;

if　(isNodeJs)　{
  var Benchmark = require('benchmark');
  var cv = require('../../opencv');
  var HelpFunc = require('../perf_helpfunc');
  var Base = require('../base');
} else {
  var paramsElement = document.getElementById('params');
  var runButton = document.getElementById('runButton');
  var logElement = document.getElementById('log');
}

function perf() {
  
  console.log('opencv.js loaded');
  if (isNodeJs) {
    global.cv = cv;
    global.combine = HelpFunc.combine;
    global.cvtStr2cvSize = HelpFunc.cvtStr2cvSize;
    global.cvSize = Base.getCvSize();
  } else {
    enableButton();
    cvSize = getCvSize();
  }
  let totalCaseNum, currentCaseId;

  const matTypesUpLinear = ['CV_8UC1', 'CV_8UC2', 'CV_8UC3', 'CV_8UC4'];
  const size1UpLinear = [cvSize.szVGA];
  const size2UpLinear = [cvSize.szqHD, cvSize.sz720p];
  const combiUpLinear = combine(matTypesUpLinear, size1UpLinear, size2UpLinear);

  const combiDownLinear = [
    ['CV_8UC1', cvSize.szVGA, cvSize.szQVGA],
    ['CV_8UC2', cvSize.szVGA, cvSize.szQVGA],
    ['CV_8UC3', cvSize.szVGA, cvSize.szQVGA],
    ['CV_8UC4', cvSize.szVGA, cvSize.szQVGA],
    ['CV_8UC1', cvSize.szqHD, cvSize.szVGA],
    ['CV_8UC2', cvSize.szqHD, cvSize.szVGA],
    ['CV_8UC3', cvSize.szqHD, cvSize.szVGA],
    ['CV_8UC4', cvSize.szqHD, cvSize.szVGA],
    ['CV_8UC1', cvSize.sz720p, cvSize.sz213x120],// face detection min_face_size = 20%
    ['CV_8UC2', cvSize.sz720p, cvSize.sz213x120],// face detection min_face_size = 20%
    ['CV_8UC3', cvSize.sz720p, cvSize.sz213x120],// face detection min_face_size = 20%
    ['CV_8UC4', cvSize.sz720p, cvSize.sz213x120],// face detection min_face_size = 20%
    ['CV_8UC1', cvSize.sz720p, cvSize.szVGA],
    ['CV_8UC2', cvSize.sz720p, cvSize.szVGA],
    ['CV_8UC3', cvSize.sz720p, cvSize.szVGA],
    ['CV_8UC4', cvSize.sz720p, cvSize.szVGA],
    ['CV_8UC1', cvSize.sz720p, cvSize.szQVGA],
    ['CV_8UC2', cvSize.sz720p, cvSize.szQVGA],
    ['CV_8UC3', cvSize.sz720p, cvSize.szQVGA],
    ['CV_8UC4', cvSize.sz720p, cvSize.szQVGA]
  ];

  const matTypesAreaFast = ['CV_8UC1', 'CV_8UC3', 'CV_8UC4', 'CV_16UC1', 'CV_16UC3', 'CV_16UC4'];
  const sizesAreaFast = [cvSize.szVGA, cvSize.szqHD, cvSize.sz720p, cvSize.sz1080p];
  const scalesAreaFast = [2];
  const combiAreaFast = combine(matTypesAreaFast, sizesAreaFast, scalesAreaFast);

  function addResizeCase(suite, type) {
    suite.add('resize', function() {
      if (type == "area") {
        cv.resize(src, dst, dst.size(), 0, 0, cv.INTER_AREA);
      } else {
        cv.resize(src, dst, to, 0, 0, cv.INTER_LINEAR_EXACT);
      }
    }, {
        'setup': function() {
          let from = this.params.from;
          let to = this.params.to;
          let matType = cv[this.params.matType];
          let src = new cv.Mat(from, matType);
          let type = this.params.modeType;
          let dst; 
          if (type == "area") {
            dst = new cv.Mat(from.height/scale, from.width/scale, matType);
          } else {
            dst = new cv.Mat(to, matType);
            fillGradient(cv, src);
          }
          },
        'teardown': function() {
          src.delete();
          dst.delete();
        }
    });
  }

  function addResizeModeCase(suite, combination, type) {
    totalCaseNum += combination.length;
    for (let i = 0; i < combination.length; ++i) {
      let matType = combination[i][0];
      let from = combination[i][1];
      let params;
      if (type == "area") {
        let scale = combination[i][2];
        params = { from: from, scale: scale, matType: matType, modeType: type };
      } else {
        let to = combination[i][2];
        params = { from: from, to: to, matType: matType, modeType: type};
      }
      addKernelCase(suite, params, type, addResizeCase)
    }
  }

  function decodeParams2Case(suite, params) {
    let sizeString = (params.match(/[0-9]+x[0-9]+/g) || []).slice(0, 2).toString();
    let sizes = (sizeString.match(/[0-9]+/g) || []);
    let size1Str = sizes.slice(0, 2).toString();
    let size2Str = sizes.slice(2, 5).toString();
    let matType = (params.match(/CV\_[0-9]+[A-z][A-z][0-9]/) || []).toString();
    let size1 = cvtStr2cvSize(size1Str);
    let size2 = cvtStr2cvSize(size2Str);
    // check if the params match and add case
    for (let i = 0; i < combinations.length; ++i) {
      let combination = combinations[i];
      for (let j = 0; j < combination.length; ++j) {
        if (matType === combination[j][0] && size1 === combination[j][1] && size2 === combination[j][2]) {
          addResizeModeCase(suite, [combination[j]], "linear");
        }
      }
    }
  }

  function genBenchmarkCase(paramsContent) {
    let suite = new Benchmark.Suite;
    totalCaseNum = 0;
    currentCaseId = 0;
    if (/\(\w+,[\ ]*[0-9]+x[0-9]+,[\ ]*[0-9]+x[0-9]+\)/g.test(paramsContent.toString())) {
      let params = paramsContent.toString().match(/\(\w+,[\ ]*[0-9]+x[0-9]+,[\ ]*[0-9]+x[0-9]+\)/g)[0];
      decodeParams2Case(suite, params);
    } else {
      log("no filter or getting invalid params, run all the cases");
      addResizeModeCase(suite, combiUpLinear, "linear");
      addResizeModeCase(suite, combiDownLinear, "linear");
    }
    setBenchmarkSuite(suite, "resize", currentCaseId);
    log(`Running ${totalCaseNum} tests from Resize`);
    suite.run({ 'async': true }); // run the benchmark
  }

  // init
  let combinations = [combiUpLinear, combiDownLinear];//, combiAreaFast];

  // set test filter params
  if (isNodeJs) {
    const args = process.argv.slice(2);
    let paramsContent = '';
    if (/--test_param_filter=\(\w+,[\ ]*[0-9]+x[0-9]+,[\ ]*[0-9]+x[0-9]+\)/g.test(args.toString())) {
      paramsContent = args.toString().match(/\(\w+,[\ ]*[0-9]+x[0-9]+,[\ ]*[0-9]+x[0-9]+\)/g)[0];
    }
    genBenchmarkCase(paramsContent);
  } else {
    runButton.onclick = function()　{
      let paramsContent = paramsElement.value;
      genBenchmarkCase(paramsContent);
      if (totalCaseNum !== 0) {
        disableButton();
      }
    }
  }
};

async function main() {
  if (cv instanceof Promise) {
    cv = await cv;
    perf();
  } else {
    cv.onRuntimeInitialized = perf;
  }
}

main();