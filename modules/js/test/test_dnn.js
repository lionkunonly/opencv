QUnit.module('DNN', {});
QUnit.test('Test dnn', function(assert) {
    function randomFill(data) {
        for (let i = 0; i < data.length; ++i) {
            data[i] = Math.random() * 2 - 1
        }
    }

    {
        const inputShape = [1, 3, 227, 227];
        const wgtShape = [96, 3, 11, 11];
        const biasShape = [96, 1, 1, 1];
        const stride = 4;
        const outputShape = [1, 96, 55, 55];

        let lp = new cv.LayerParams;
        lp.setInt('num_output', wgtShape[0]);
        lp.setInt('group', 1);
        lp.setInt('stride', stride);
        lp.setInt('kernel_size', wgtShape[2]);
        let wgtBlob = new cv.Mat(wgtShape, cv.CV_32F);
        randomFill(wgtBlob.data32F);
        let biasBlob = new cv.Mat(biasShape, cv.CV_32F);
        randomFill(biasBlob.data32F);
        let inpBlob = new cv.Mat(inputShape, cv.CV_32F);
        randomFill(inpBlob.data32F);
        let blobs = new cv.MatVector;
        blobs.push_back(wgtBlob);
        blobs.push_back(biasBlob);
        lp.blobs = blobs;
        let layer = Module.Layer.createInstance('Convolution', lp);
        [outShapes, internalShapes] = layer.getMemoryShapes([inputShape], 0);
        assert.deepEqual(outShapes, [outputShape]);

        let inpBlobs = new cv.MatVector;
        let outBlobs = new cv.MatVector;
        let internalBlobs = new cv.MatVector;

        for (let i = 0; i < outShapes.length; i++)
        {
            outBlobs.push_back(new cv.Mat(outShapes[i], cv.CV_32F));
        }

        for (let i = 0; i < internalShapes.length; i++)
        {
            internalBlobs.push_back(new cv.Mat(internalShapes[i], cv.CV_32F));
        }

        inpBlobs.push_back(inpBlob)

        layer.finalize(inpBlobs, outBlobs);

        layer.forward(inpBlobs, outBlobs, internalBlobs);
        
        for (let i = 0; i < 3; ++i) {
            let start = performance.now();
            layer.forward(inpBlobs, outBlobs, internalBlobs);
            let end = performance.now();
            console.log(`elapsed time: ${end - start} ms`);
        }
    }
});