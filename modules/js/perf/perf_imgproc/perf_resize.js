// you may need install benchmark with npm by 
// `npm i --save benchmark`

var Benchmark = require('benchmark');
var cv = require('../../opencv');
var help_func = require('../perf_helpfunc');

cv.onRuntimeInitialized = () => {
  console.log('opencv.js loaded');
  // Benchmark.options.minSamples = 50;     // set the minimum of Samples for each case
  var suite = new Benchmark.Suite;
  global.cv = cv;
  global.help_func = help_func;
  global.Params = [];
  let totalTestNum = 0;
  require('../base');  // need global cv

  const matTypesUpLinear = ['CV_8UC1', 'CV_8UC2', 'CV_8UC3', 'CV_8UC4'];
  const size1UpLinear = [cvSize.szVGA];
  const size2UpLinear = [cvSize.szqHD, cvSize.sz720p];
  const combiUpLinear = help_func.combine(matTypesUpLinear, size1UpLinear, size2UpLinear);

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
  const combiAreaFast = help_func.combine(matTypesAreaFast, sizesAreaFast, scalesAreaFast);

  function addResizeUpLinearCase(combination) {
    totalTestNum += combination.length;
    for (let i = 0; i < combination.length; ++i) {
      let mat_type = combination[i][0];
      let from = combination[i][1];
      let to = combination[i][2];
      Params.push([mat_type, from, to]);

      suite.add('resize', function() {
        cv.resize(src, dst, this.param.to, 0, 0, cv.INTER_LINEAR_EXACT);
        }, {
          'setup': function() {
            let from = this.param.from;
            let to = this.param.to;
            let mat_type = this.param.mat_type;
            let src = new cv.Mat(from, mat_type);
            let dst = new cv.Mat(to, mat_type);
            help_func.fillGradient(cv, src);
              },
          'teardown': function() {
            src.delete();
            dst.delete();
          }
      });

      // set init params
      let index = suite.length - 1;
      suite[index].param = {
        from: from,
        to: to,
        mat_type: cv[mat_type]
      };
    }
  }

  function addResizeDownLinearCase(combination) {
    totalTestNum += combination.length;
    for (let i = 0; i < combination.length; ++i) {
      let mat_type = combination[i][0];
      let from = combination[i][1];
      let to = combination[i][2];
      Params.push([mat_type, from, to]);

      suite.add('resize', function() {
        cv.resize(src, dst, to, 0, 0, cv.INTER_LINEAR_EXACT);
        }, {
          'setup': function() {
            let from = this.param.from;
            let to = this.param.to;
            let mat_type = this.param.mat_type;
            let src = new cv.Mat(from, mat_type);
            let dst = new cv.Mat(to, mat_type);
            help_func.fillGradient(cv, src);
              },
          'teardown': function() {
            src.delete();
            dst.delete();
          }
      });

      // set init params
      let index = suite.length - 1;
      suite[index].param = {
        from: from,
        to: to,
        mat_type: cv[mat_type]
      };
    }
  }

  function addResizeAreaFastCase(combination) {
    totalTestNum += combination.length;
    for (let i = 0; i < combination.length; ++i) {
      let mat_type = combination[i][0];
      let from = combination[i][1];
      let scale = combination[i][2];
      from.width = (Math.floor(from.width/scale))*scale;
      from.height = (Math.floor(from.height/scale))*scale;
      let to = {
        width: from.width/scale, 
        height: from.height/scale};  // for param print
      Params.push([mat_type, from, to]);

      suite.add('resize', function() {
        cv.resize(src, dst, dst.size(), 0, 0, cv.INTER_AREA);
        }, {
          'setup': function() {
            let from = this.param.from;
            let scale = this.param.scale;
            let mat_type = this.param.mat_type;
            let src = new cv.Mat(from, mat_type);
            let dst = new cv.Mat(from.height/scale, from.width/scale, mat_type);
              },
          'teardown': function() {
            src.delete();
            dst.delete();
          }
      });
      // set init params
      let index = suite.length - 1;
      suite[index].param = {
        from: from,
        scale: scale,
        mat_type: cv[mat_type]
      };
    }
  }

  // init
  let resize_func = [addResizeUpLinearCase, addResizeDownLinearCase];//, addResizeAreaFastCase];
  let combinations = [combiUpLinear, combiDownLinear];//, combiAreaFast];

  // Flags
  // set test filter params
  const args = process.argv.slice(2);
  if (args.toString().match(/--test_param_filter/)) {
    if (/--test_param_filter=\(\w+,[\ ]*[0-9]+x[0-9]+,[\ ]*[0-9]+x[0-9]+\)/g.test(args.toString())) {
      let param = args.toString().match(/--test_param_filter=\(\w+,[\ ]*[0-9]+x[0-9]+,[\ ]*[0-9]+x[0-9]+\)/g)[0];
      let sizeString = param.match(/[0-9]+x[0-9]+/g).slice(0, 2).toString();
      let sizes = sizeString.match(/[0-9]+/g);
      let size1Str = sizes.slice(0, 2).toString();
      let size2Str = sizes.slice(2, 5).toString();
      let mat_type = param.match(/CV\_[0-9]+[A-z][A-z][0-9]/).toString();
      let size1 = help_func.cvtStr2cvSize(size1Str);
      let size2 = help_func.cvtStr2cvSize(size2Str);
      // check if the params match and add case
      for (let i = 0; i < combinations.length; ++i) {
        let combination = combinations[i];
        for (let j = 0; j < combination.length; ++j) {
          if (mat_type === combination[j][0] && size1 === combination[j][1] && size2 === combination[j][2]) {
            resize_func[i]([combination[j]]);
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
      let index = event.target.id-1;
      let mat_type = Params[index][0];
      let size1 = Params[index][1];
      let size2 = Params[index][2];
      console.log(`Params: (${mat_type}, ${parseInt(size1.width)}x${parseInt(size1.height)},`+
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