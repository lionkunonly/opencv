// you may need install benchmark with npm by 
// `npm i --save benchmark`

var Benchmark = require('benchmark');
var cv = require('../opencv.js');
var help_func = require('../perf_helpfunction');

cv.onRuntimeInitialized = () => {
  console.log('opencv.js loaded');
  // Benchmark.options.minSamples = 50;     // set the minimum of Samples for each case
  var suite = new Benchmark.Suite;
  global.cv = cv;
  global.help_func = help_func;
  global.Params = [];
  let totalTestNum = 0;

  const szODD = new cv.Size(127, 61),
        szVGA = new cv.Size(640, 480),
        sz720p = new cv.Size(1280, 720);
        sz1080p = new cv.Size(1920, 1080),
        szTemp = new cv.Size(130, 60);
        szqHD = new cv.Size(960, 540);
        szQVGA = new cv.Size(320, 240);

  function addResizeUpLinearCase() {
    let matTypes = ['CV_8UC1', 'CV_8UC2', 'CV_8UC3', 'CV_8UC4'];
    let size1 = [szVGA];
    let size2 = [szqHD, sz720p];
    let combination = help_func.combine(matTypes, size1, size2);
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

  function addResizeDownLinearCase() {
    let tmpSize = new cv.Size(120 * sz720p.width / sz720p.height, 120);
    let combination = [
                ['CV_8UC1', szVGA, szQVGA],
                ['CV_8UC2', szVGA, szQVGA],
                ['CV_8UC3', szVGA, szQVGA],
                ['CV_8UC4', szVGA, szQVGA],
                ['CV_8UC1', szqHD, szVGA],
                ['CV_8UC2', szqHD, szVGA],
                ['CV_8UC3', szqHD, szVGA],
                ['CV_8UC4', szqHD, szVGA],
                ['CV_8UC1', sz720p, tmpSize],//face detection min_face_size = 20%
                ['CV_8UC2', sz720p, tmpSize],//face detection min_face_size = 20%
                ['CV_8UC3', sz720p, tmpSize],//face detection min_face_size = 20%
                ['CV_8UC4', sz720p, tmpSize],//face detection min_face_size = 20%
                ['CV_8UC1', sz720p, szVGA],
                ['CV_8UC2', sz720p, szVGA],
                ['CV_8UC3', sz720p, szVGA],
                ['CV_8UC4', sz720p, szVGA],
                ['CV_8UC1', sz720p, szQVGA],
                ['CV_8UC2', sz720p, szQVGA],
                ['CV_8UC3', sz720p, szQVGA],
                ['CV_8UC4', sz720p, szQVGA]
    ];
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

  function addResizeAreaFastCase() {
    let matTypes = ['CV_8UC1', 'CV_8UC3', 'CV_8UC4', 'CV_16UC1', 'CV_16UC3', 'CV_16UC4'];
    let sizes = [szVGA, szqHD, sz720p, sz1080p];
    let scales = [2];
    let combination = help_func.combine(matTypes, sizes, scales);
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

  // Flags
  // set test filter params
  const args = process.argv.slice(2);
  if (args.toString().match(/--test_param_filter/)) {
    if (/--test_param_filter=\(\w+,[\ ]*[0-9]+x[0-9]+,[\ ]*[0-9]+x[0-9]+\)/g.test(args.toString())) {
      let param = args.toString().match(/--test_param_filter=\(\w+,[\ ]*[0-9]+x[0-9]+,[\ ]*[0-9]+x[0-9]+\)/g)[0];
      let sizeString = param.match(/[0-9]+x[0-9]+/g).slice(0, 2).toString();
      let sizes = sizeString.match(/[0-9]+/g).toString();
      let mat_type = param.match(/CV\_[0-9]+[A-z][A-z][0-9]/).toString();
    }
  } else {
    // no filter, test all the cases
    addResizeUpLinearCase();
    addResizeDownLinearCase();
    addResizeAreaFastCase();
  }

  console.log(`Running ${totalTestNum} tests from Resize`); 
  suite
    // add listeners
    .on('cycle', function(event) {
      console.log(`=== ${event.target.name} ${event.target.id} ===`);
      let index = event.target.id-1;
      console.log(`Params: (${Params[index][0]}, ${Params[index][1].width}x${Params[index][1].height}, ${Params[index][2].width}x${Params[index][2].height})`);
      console.log('elapsed time:' +String(event.target.times.elapsed*1000)+' ms');
      console.log('mean time:' +String(event.target.stats.mean*1000)+' ms');
      console.log('stddev time:' +String(event.target.stats.deviation*1000)+' ms');
      console.log(String(event.target));
    })
    .on('error', function(event) { console.log(event); })
    .on('complete', function(event) {
      console.log(``);
      console.log(`###################################`)
      console.log(`Finished testing ${event.currentTarget.length} cases`);
    })

    // run async
    .run({ 'async': true });
};