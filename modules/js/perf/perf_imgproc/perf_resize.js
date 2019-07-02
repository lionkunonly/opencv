var Benchmark = require('benchmark');
var cv = require('../../opencv');
var HelpFunc = require('../perf_helpfunc');
var Base = require('../base');

cv.onRuntimeInitialized = () => {
  console.log('opencv.js loaded');
  let suite = new Benchmark.Suite;
  global.cv = cv;
  global.HelpFunc = HelpFunc;
  let totalTestNum = 0;
  const cvSize = Base.cvSize;

  const matTypesUpLinear = ['CV_8UC1', 'CV_8UC2', 'CV_8UC3', 'CV_8UC4'];
  const size1UpLinear = [cvSize.szVGA];
  const size2UpLinear = [cvSize.szqHD, cvSize.sz720p];
  const combiUpLinear = HelpFunc.combine(matTypesUpLinear, size1UpLinear, size2UpLinear);

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
  const combiAreaFast = HelpFunc.combine(matTypesAreaFast, sizesAreaFast, scalesAreaFast);

  function addResizeUpLinearCase(combination) {
    totalTestNum += combination.length;
    for (let i = 0; i < combination.length; ++i) {
      let matType = combination[i][0];
      let from = combination[i][1];
      let to = combination[i][2];

      suite.add('resize', function() {
        cv.resize(src, dst, to, 0, 0, cv.INTER_LINEAR_EXACT);
        }, {
          'setup': function() {
            let from = this.params.from;
            let to = this.params.to;
            let matType = cv[this.params.matType];
            let src = new cv.Mat(from, matType);
            let dst = new cv.Mat(to, matType);
            HelpFunc.fillGradient(cv, src);
              },
          'teardown': function() {
            src.delete();
            dst.delete();
          }
      });

      // set init params
      let index = suite.length - 1;
      suite[index].params = {
        from: from,
        to: to,
        matType: matType
      };
    }
  }

  function addResizeDownLinearCase(combination) {
    totalTestNum += combination.length;
    for (let i = 0; i < combination.length; ++i) {
      let matType = combination[i][0];
      let from = combination[i][1];
      let to = combination[i][2];

      suite.add('resize', function() {
        cv.resize(src, dst, to, 0, 0, cv.INTER_LINEAR_EXACT);
        }, {
          'setup': function() {
            let from = this.params.from;
            let to = this.params.to;
            let matType = cv[this.params.matType];
            let src = new cv.Mat(from, matType);
            let dst = new cv.Mat(to, matType);
            HelpFunc.fillGradient(cv, src);
              },
          'teardown': function() {
            src.delete();
            dst.delete();
          }
      });

      // set init params
      let index = suite.length - 1;
      suite[index].params = {
        from: from,
        to: to,
        matType: matType
      };
    }
  }

  function addResizeAreaFastCase(combination) {
    totalTestNum += combination.length;
    for (let i = 0; i < combination.length; ++i) {
      let matType = combination[i][0];
      let from = combination[i][1];
      let scale = combination[i][2];
      from.width = (Math.floor(from.width/scale))*scale;
      from.height = (Math.floor(from.height/scale))*scale;
      let to = {
        width: from.width/scale, 
        height: from.height/scale};  // for params print

      suite.add('resize', function() {
        cv.resize(src, dst, dst.size(), 0, 0, cv.INTER_AREA);
        }, {
          'setup': function() {
            let from = this.params.from;
            let scale = this.params.scale;
            let matType = cv[this.params.matType];
            let src = new cv.Mat(from, matType);
            let dst = new cv.Mat(from.height/scale, from.width/scale, matType);
              },
          'teardown': function() {
            src.delete();
            dst.delete();
          }
      });
      // set init params
      let index = suite.length - 1;
      suite[index].params = {
        from: from,
        scale: scale,
        matType: matType
      };
    }
  }

  // init
  let resizeFunc = [addResizeUpLinearCase, addResizeDownLinearCase];//, addResizeAreaFastCase];
  let combinations = [combiUpLinear, combiDownLinear];//, combiAreaFast];

  // Flags
  // set test filter params
  const args = process.argv.slice(2);
  if (args.toString().match(/--test_param_filter/)) {
    if (/--test_param_filter=\(\w+,[\ ]*[0-9]+x[0-9]+,[\ ]*[0-9]+x[0-9]+\)/g.test(args.toString())) {
      let params = args.toString().match(/--test_param_filter=\(\w+,[\ ]*[0-9]+x[0-9]+,[\ ]*[0-9]+x[0-9]+\)/g)[0];
      let sizeString = params.match(/[0-9]+x[0-9]+/g).slice(0, 2).toString();
      let sizes = sizeString.match(/[0-9]+/g);
      let size1Str = sizes.slice(0, 2).toString();
      let size2Str = sizes.slice(2, 5).toString();
      let matType = params.match(/CV\_[0-9]+[A-z][A-z][0-9]/).toString();
      let size1 = HelpFunc.cvtStr2cvSize(size1Str);
      let size2 = HelpFunc.cvtStr2cvSize(size2Str);
      // check if the params match and add case
      for (let i = 0; i < combinations.length; ++i) {
        let combination = combinations[i];
        for (let j = 0; j < combination.length; ++j) {
          if (matType === combination[j][0] && size1 === combination[j][1] && size2 === combination[j][2]) {
            resizeFunc[i]([combination[j]]);
          }
        }
      }
    }
  } else {
    // no filter, test all the cases
    addResizeUpLinearCase(combiUpLinear);
    addResizeDownLinearCase(combiDownLinear);
  }

  console.log(`Running ${totalTestNum} tests from Resize`);
  suite
    // add listeners
    .on('cycle', function(event) {
      console.log(`=== ${event.target.name} ${event.target.id} ===`);
      let params = event.target.params;
      let matType = params.matType;
      let size1 = params.from;
      let size2 = params.to;
      console.log(`params: (${matType},${parseInt(size1.width)}x${parseInt(size1.height)},`+
                  `${parseInt(size2.width)}x${parseInt(size2.height)})`);
      console.log('elapsed time:' +String(event.target.times.elapsed*1000)+' ms');
      console.log('mean time:' +String(event.target.stats.mean*1000)+' ms');
      console.log('stddev time:' +String(event.target.stats.deviation*1000)+' ms');
      console.log(String(event.target));
    })
    .on('error', function(event) { console.log(`test case ${event.target.name} failed`); })
    .on('complete', function(event) {
      console.log(``);
      console.log(`###################################`)
      console.log(`Finished testing ${event.currentTarget.length} cases`);
    })

    // run async
    .run({ 'async': true });
};