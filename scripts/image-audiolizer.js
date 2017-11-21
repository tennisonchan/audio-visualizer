let canvas = document.createElement('canvas');
let ctx = canvas.getContext('2d');
let mount = document.querySelector('#visualizer-mount');
canvas.width = 500;
canvas.height = 500;

// function transformImageArray(array) {
//   let bufferLength = array.length;
//   for (let pixel = 0; pixel <= bufferLength; pixel -= 4) {
//     let r = Math.random();
//     imgData.data[pixel] = 1;
//     imgData.data[pixel + 1] = 1;
//     imgData.data[pixel + 2] = 255 * Math.pow(r, dimness) | 0;
//     imgData.data[pixel + 3] = 255;
//   }
// }

class ImageAudiolizer {
  constructor(audioCtx) {
    this.audioCtx = audioCtx;
    // this.getImage(imageSrc, this.imageOnland);
  }

  getImageData(img) {
    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');
    let { width, height } = img;

    canvas.width = width || 500;
    canvas.height = height || 500;
    ctx.drawImage(img, 0, 0);

    return ctx.getImageData(0, 0, width, height)
  }

  getImage (url, callback) {
    let img = new Image();
    img.onload = callback.bind(this, img);
    img.src = url;

    return img;
  }

  scaleImageToAudio (arr) {
    return arr.map(p => ((p / 127.5) - 1));
  }

  float32ArrayToAudioBuffer (audioBuffer, imgArray, channelNumber = 0) {
    let array = this.scaleImageToAudio(imgArray);
    audioBuffer.copyToChannel(array, channelNumber);

    return audioBuffer;
  }

  toAudioBuffer(arrays) {
    let audioBuffer = this.audioCtx.createBuffer(arrays.length, arrays[0].length, this.audioCtx.sampleRate);

    for(let i = 0; i < arrays.length; i++) {
      audioBuffer = this.float32ArrayToAudioBuffer(audioBuffer, arrays[i], i);
    }

    return audioBuffer;
  }

  separateColorLayer(imgArray) {
    let arrays = [];

    arrays[0] = imgArray.filter((_, i) => (i+1) % 4 == 1);
    arrays[1] = imgArray.filter((_, i) => (i+1) % 4 == 2);
    arrays[2] = imgArray.filter((_, i) => (i+1) % 4 == 3);
    arrays[3] = imgArray.filter((_, i) => (i+1) % 4 == 0);

    return arrays;
  }

  imageOnland (img) {
    let idata = this.getImageData(img);

    let imgFloatArray = new Float32Array(idata.data);
    let arrays = this.separateColorLayer(imgFloatArray);

    let audioBuffer = this.toAudioBuffer(arrays);

    audioVisualizer.visualize(audioBuffer);
  }
}

const ia = new ImageAudiolizer(new AudioContext());
// ia.getImage('./images/serena.png', ia.imageOnland);