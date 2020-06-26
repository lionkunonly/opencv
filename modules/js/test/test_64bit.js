if (typeof module !== 'undefined' && module.exports) {
    // The environment is Node.js
    var cv = require('./opencv.js'); // eslint-disable-line no-var
}

QUnit.test('test_64_bits', function(assert) {
    
    //countNonZero()
    {
        //Construct a Mat with shape (1000, 1000) 
        let floatImage = new Float64Array(1000000)
        for (i = 0; i < 1000000; i++) {
            floatImage[i] = 255.0
            if(i%5 == 0) {
                floatImage[i] = 0.0
            }
        }

        let img_elem = 1000*1000*1;
        let expected_img_data_ptr = cv._malloc(img_elem);
        let expected_img_data_heap = new Float64Array(cv.HEAPF64.buffer,
                                                        expected_img_data_ptr,
                                                        img_elem);
        expected_img_data_heap.set(new Float64Array(floatImage.buffer));
    
        let expected_img = new cv.Mat( 1000, 1000, cv.CV_64F, expected_img_data_ptr, 0);

        let t0 = window.performance.now();
        let result = cv.countNonZero(expected_img);
        let t1 = window.performance.now();
        assert.ok(expected_img instanceof cv.Mat);
        assert.equal (result, 800000);
        console.log("TimeCost for countNonZero : " + (t1-t0) + " ms");

        expected_img.delete();
    }

    //Mat::dot()
    {
        //Construct a Mat with shape (1000, 1000) 
        let mat = cv.Mat.ones(1000, 1000, cv.CV_64FC1);
        let mat2 = cv.Mat.eye(1000, 1000, cv.CV_64FC1);


        let t0 = window.performance.now();
        let result1 = mat.dot(mat);
        let t1 = window.performance.now();

        assert.equal(result1, 1000000.0);
        assert.equal(mat.dot(mat2), 1000.0);
        assert.equal(mat2.dot(mat2), 1000.0);

        console.log("TimeCost for Mat::dot() : " + (t1-t0) + " ms");

        mat.delete();
        mat2.delete();
    }


    //split
    {
        const R =7.0;
        const G =13.0;
        const B =29.0;

        let mat = cv.Mat.ones(1000, 1000, cv.CV_64FC3);
        let view = mat.data64F;
        view[0] = R;
        view[1] = G;
        view[2] = B;

        let bgrPlanes = new cv.MatVector();

        let t0 = window.performance.now();
        cv.split(mat, bgrPlanes);
        let t1 = window.performance.now();
        assert.equal(bgrPlanes.size(), 3);

        let rMat = bgrPlanes.get(0);
        view = rMat.data64F;
        assert.equal(view[0], R);

        let gMat = bgrPlanes.get(1);
        view = gMat.data64F;
        assert.equal(view[0], G);


        let bMat = bgrPlanes.get(2);
        view = bMat.data64F;
        assert.equal(view[0], B);

        console.log("TimeCost for split() : " + (t1-t0) + " ms");

        mat.delete();
        rMat.delete();
        gMat.delete();
        bgrPlanes.delete();
        bMat.delete();
    }

    //merge
    {
        const R =7.0;
        const G =13.0;
        const B =29.0;

        let mat = new cv.Mat();
        let rgbPlanes = new cv.MatVector();;


        let rMat = cv.Mat.ones(1000, 1000, cv.CV_64FC1);
        let view = rMat.data64F;
        view[0] = R;
        rgbPlanes.push_back(rMat);

        let gMat = cv.Mat.ones(1000, 1000, cv.CV_64FC1);
        view = gMat.data64F;
        view[0] = G;
        rgbPlanes.push_back(gMat);

        let bMat = cv.Mat.ones(1000, 1000, cv.CV_64FC1);
        view = bMat.data64F;
        view[0] = B;
        rgbPlanes.push_back(bMat);

        
        assert.equal(rgbPlanes.size(), 3);

        let t0 = window.performance.now();
        cv.merge(rgbPlanes, mat);
        let t1 = window.performance.now();
        view = mat.data64F

        assert.equal(view[0], R);
        assert.equal(view[1], G);
        assert.equal(view[2], B);
    

        console.log("TimeCost for merge() : " + (t1-t0) + " ms");

        mat.delete();
        rMat.delete();
        gMat.delete();
        rgbPlanes.delete();
        bMat.delete();
    }
});