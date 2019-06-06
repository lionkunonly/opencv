var Benchmark = require('./benchmark');
var cv = require('./opencv.js');

cv.onRuntimeInitialized = () => {
  console.log('opencv.js loaded');
  // Benchmark.options.minSamples = 50;
  var suite = new Benchmark.Suite;

  suite.add('GaussianBlur', function() {
    cv.GaussianBlur(mat1, mat2, new cv.Size(3, 3), 0, 0, // eslint-disable-line new-cap
                        cv.BORDER_DEFAULT);
  }, {
    'setup': function() {
        var cv = require('./opencv.js');
        var mat1 = cv.Mat.ones(640, 480, cv.CV_8UC4);
        var mat2 = new cv.Mat();
        },
    'teardown': function() {
        mat1.delete();
        mat2.delete();
      }
  })

  suite.add('cvtColor', function() {
    cv.cvtColor(mat1, mat2, cv.COLOR_BGR2GRAY, 0);
    }, {
      'setup': function() {
        var cv = require('./opencv.js');
        var mat1 = cv.Mat.ones(640, 480, cv.CV_8UC3);
        var mat2 = new cv.Mat();
          },
      'teardown': function() {
        mat1.delete();
        mat2.delete();
      }
})
  
  suite.add('threshold', function() {
    cv.threshold(source, dest, THRESHOLD, THRESHOLD_MAX, cv.THRESH_BINARY);
  }, {
    'setup': function() {
      var cv = require('./opencv.js');
      const THRESHOLD = 127.0;
      const THRESHOLD_MAX = 210.0;
      let source = new cv.Mat(640, 480, cv.CV_8UC1);
      let sourceView = source.data;
      sourceView[0] = 0; // < threshold
      sourceView[1] = 100; // < threshold
      sourceView[2] = 200; // > threshold
      let dest = new cv.Mat();
        },
    'teardown': function() {
      source.delete();
      dest.delete();
    }
  })

  suite.add('integral2', function() {
    cv.integral2(mat, sum, sqSum, -1, -1);
  }, {
    'setup': function() {
      var cv = require('./opencv.js');
      let mat = cv.Mat.eye({height: 640, width: 480}, cv.CV_8UC1);
      let sum = new cv.Mat();
      let sqSum = new cv.Mat();
        },
    'teardown': function() {
      mat.delete();
      sum.delete();
      sqSum.delete();
    }
  })

  suite
    // add listeners
    .on('cycle', function(event) {
        console.log(`=== ${event.target.name} ===`);
        console.log('elapsed time:' +String(event.target.times.elapsed*1000)+' ms');
        console.log('mean time:' +String(event.target.stats.mean*1000)+' ms');
        console.log('stddev time:' +String(event.target.stats.deviation*1000)+' ms');
        console.log(String(event.target));
    })
    .on('complete', function() {
        console.log('Fastest is ' + this.filter('fastest').map('name'));
    })
    // run async
    .run({ 'async': true });
  };
