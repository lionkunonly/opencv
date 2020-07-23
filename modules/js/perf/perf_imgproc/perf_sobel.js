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

    //input design
    //(size, matType, ddepth, direction, ksize, borderType). Example: (640x480, CV_8U, CV_8U, dx, k_1, BORDER_DEFAULT)
    // const SobelSize = [cvSize.szODD, cvSize.szQVGA, cvSize.szVGA, cvSize.szqHD, cvSize.sz720p, cvSize.sz1080p];
    const SobelSize = [cvSize.szVGA, cvSize.sz720p, cvSize.sz1080p];
    const SobelDirection = ["dx", "dy"];
    const SobelKsize = ["k_1", "k_3", "k_5", "k_7"];
    const SobelBoderType = ["BORDER_CONSTANT", "BORDER_REPLICATE", "BORDER_REFLECT", "BORDER_REFLECT_101","BORDER_TRANSPARENT", 
        "BORDER_REFLECT101", "BORDER_DEFAULT", "BORDER_ISOLATED"];

    const combiSobelMode8U = combine(SobelSize, ["CV_8U"], ["CV_8U", "CV_16S", "CV_32F", "CV_64F"], SobelDirection, SobelKsize, SobelBoderType);
    const combiSobelMode16U = combine(SobelSize, ["CV_16U"], ["CV_16U", "CV_32F", "CV_64F"], SobelDirection, SobelKsize, SobelBoderType);
    const combiSobelMode16S = combine(SobelSize, ["CV_16S"], ["CV_16S", "CV_32F", "CV_64F"], SobelDirection, SobelKsize, SobelBoderType);
    const combiSobelMode32F = combine(SobelSize, ["CV_32F"], ["CV_32F", "CV_64F"], SobelDirection, SobelKsize, SobelBoderType);
    const combiSobelMode64F = combine(SobelSize, ["CV_64F"], ["CV_64F"], SobelDirection, SobelKsize, SobelBoderType);

    function addSobelCase(suite, type) {
        suite.add('sobel', function() {
            cv.Sobel(src, dst, ddepth, dx, dy, ksize, 1, 0, borderType);
          }, {
              'setup': function() {
                let size = this.params.size;
                let matType = cv[this.params.matType];
                let ddepth = cv[this.params.ddepth];
                let direction = this.params.direction;
                let ksize = parseInt(this.params.ksize.split("_").pop());
                let borderType =cv[this.params.borderType];
                let src = new cv.Mat(size, matType);
                let dst = new cv.Mat(size, matType);
                let dx = 0;
                let dy = 0;

                if (ddepth == matType) {
                  ddepth = -1;
                }
                
                if (direction == "dx") {dx = 1;}
                else {dy = 1;}
                },
              'teardown': function() {
                src.delete();
                dst.delete();
              }
          });
    }

    function addSobelModeCase(suite, combination, type) {
      totalCaseNum += combination.length;
      for (let i = 0; i < combination.length; ++i) {
        let size = combination[i][0];
        let matType = combination[i][1];
        let ddepth = combination[i][2];
        let direction = combination[i][3];
        let ksize = combination[i][4];
        let borderType = combination[i][5];
        let params = {size: size, matType: matType, ddepth: ddepth, direction: direction, ksize:ksize, borderType:borderType};  
        addKernelCase(suite, params, type, addSobelCase);
      }
    }

    function genBenchmarkCase(paramsContent) {
        let suite = new Benchmark.Suite;
        totalCaseNum = 0;
        currentCaseId = 0;

        if (/\([0-9]+x[0-9]+,[\ ]*\w+,[\ ]*\w+,[\ ]*\w+,[\ ]*\w+,[\ ]*\w+\)/g.test(paramsContent.toString())) {
            let params = paramsContent.toString().match(/\([0-9]+x[0-9]+,[\ ]*\w+,[\ ]*\w+,[\ ]*\w+,[\ ]*\w+,[\ ]*\w+\)/g)[0];
            
            let paramObjs = [];
            paramObjs.push({name:"size", value:"", reg:[""], index:0});
            paramObjs.push({name:"matType", value:"", reg:["/CV\_[0-9]+[A-z]/"], index:1});
            paramObjs.push({name:"ddepth", value:"", reg:["/CV\_[0-9]+[A-z]/g"], loc:1, index:2});
            paramObjs.push({name:"direction", value:"", reg:["/dx/", "/dy/"], index:3});
            paramObjs.push({name:"ksize", value:"", reg:["/k\_[0-9]/"], index:4});
            paramObjs.push({name:"ksize", value:"", reg:["/BORDER\_[A-z]+\_?[A-z]*/"], index:5});

            let locationList = decodeParams2Case(params, paramObjs,sobelCombinations);
            for (let i = 0; i < locationList.length; i++){
                let first = locationList[i][0];
                let second = locationList[i][1];
                addSobelModeCase(suite, [sobelCombinations[first][second]], 0);
              }
        } else {
          log("no filter or getting invalid params, run all the cases");
          addSobelModeCase(suite, combiSobelMode8U, 0);
          addSobelModeCase(suite, combiSobelMode16U, 0);
          addSobelModeCase(suite, combiSobelMode16S, 0);
          addSobelModeCase(suite, combiSobelMode32F, 0);
          addSobelModeCase(suite, combiSobelMode64F, 0);
        }
        setBenchmarkSuite(suite, "sobel", currentCaseId);
        log(`Running ${totalCaseNum} tests from Sobel`);
        suite.run({ 'async': true }); // run the benchmark
    }

    let sobelCombinations = [combiSobelMode8U, combiSobelMode16U, combiSobelMode16S, combiSobelMode32F, combiSobelMode64F];

    if (isNodeJs) {
        const args = process.argv.slice(2);
        let paramsContent = '';
        if (/--test_param_filter=\([0-9]+x[0-9]+,[\ ]*\w+,[\ ]*\w+,[\ ]*\w+,[\ ]*\w+,[\ ]*\w+\)/g.test(args.toString())) {
          paramsContent = args.toString().match(/\([0-9]+x[0-9]+,[\ ]*\w+,[\ ]*\w+,[\ ]*\w+,[\ ]*\w+,[\ ]*\w+\)/g)[0];
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