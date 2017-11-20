const WAVE = 'wave';
const FREQUENCY = 'frequency';

window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
window.cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame;

const DEFAULT = {
  backgroundColor: 'rgb(25, 25, 25)',
  height: 300,
  lineWidth: 2,
  strokeStyle: 'rgb(0, 0, 0)',
  type: FREQUENCY,
  width: 300,
};

class AudioVisualizer {
  constructor(canvasId, options = {}) {
    this.animationFrameId = null;
    this.dataArray = null;

    this.options = Object.assign({}, DEFAULT, options);

    let canvas = document.getElementById(canvasId);
    this.canvasCtx = canvas.getContext('2d');

    canvas.width = this.options.width;
    canvas.height = this.options.height;
  }

  initByteBuffer (frequencyBinCount) {
    if (!this.dataArray || this.dataArray.length !== frequencyBinCount) {
      return new Float32Array(frequencyBinCount);
    }

    return this.dataArray;
  }

  connect (analyser) {
    this.updateAnalyser(analyser);
  }

  disconnect () {
    cancelAnimationFrame(this.animationFrameId);
  }

  updateAnalyser(analyser) {
    this.render(analyser);

    this.animationFrameId = window.requestAnimationFrame(this.updateAnalyser.bind(this, analyser));
  }

  setType(type) {
    this.options.type = type === FREQUENCY ? FREQUENCY : WAVE;
  }

  render (analyser) {
    this.dataArray = this.initByteBuffer(analyser.frequencyBinCount);

    switch(this.options.type) {
      case WAVE:
        analyser.getFloatTimeDomainData(this.dataArray);
        this.renderWave(this.dataArray, this.canvasCtx);
        break;
      case FREQUENCY:
        analyser.getFloatFrequencyData(this.dataArray);
        this.renderFrequency(this.dataArray, this.canvasCtx);
        break;
    }
  }

  renderWave(dataArray, canvasCtx) {
    let bufferLength = dataArray.length;
    let x = 0;
    let { width, height, strokeStyle, lineWidth, backgroundColor } = this.options;

    canvasCtx.strokeStyle = strokeStyle;
    canvasCtx.lineWidth = lineWidth;

    for (let i = 0; i < bufferLength; i++) {
      let y = height / 2 + dataArray[i] * 200;

      if (i === 0) {
        x = 0;
        canvasCtx.clearRect(0, 0, width, height);
        canvasCtx.fillStyle = backgroundColor;
        canvasCtx.fillRect(0, 0, width, height);
        canvasCtx.beginPath();

        canvasCtx.moveTo(x, y);
      } else {
        canvasCtx.lineTo(x, y);
      }

      x += width / bufferLength;
    }

    canvasCtx.stroke();
  }

  renderFrequency(dataArray, canvasCtx) {
    let { width, height, backgroundColor } = this.options;
    let bufferLength = dataArray.length;

    let barHeight;
    let barWidth = width / bufferLength;
    let x = 0;

    canvasCtx.fillStyle = backgroundColor;
    canvasCtx.fillRect(0, 0, width, height);

    for(let i = 0; i < bufferLength; i++) {
      barHeight = - dataArray[i] * 2;

      canvasCtx.fillStyle = `rgb(${~~(255 - Math.pow(-barHeight / 15, 2))}, 50, 50)`;
      canvasCtx.fillRect(x, height, barWidth, barHeight - height / 2);

      x += barWidth + 1;
    }
  }
}