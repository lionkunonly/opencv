exports.fillGradient = function(cv, img, delta=5)
{
  let ch = img.channels();
  console.assert(!img.empty() && img.depth() == cv.CV_8U && ch <= 4);

  let n = 255 / delta;
  let r, c, i;
  for(r=0; r<img.rows; r++)
  {
    let kR = r % (2*n);
    let valR = (kR<=n) ? delta*kR : delta*(2*n-kR);
    for(c=0; c<img.cols; c++)
    {
        let kC = c % (2*n);
        let valC = (kC<=n) ? delta*kC : delta*(2*n-kC);
        let vals = [valR, valC, 200*r/img.rows, 255];
        let p = img.ptr(r, c);
        for(i=0; i<ch; i++) p[i] = vals[i];
    }
  }
}

exports.combine = function() 
{
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