const WAVE = 0;
const FREQUENCY = 1;

window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
window.cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame;

class AudioVisualizer {
  constructor(canvasId, options = {}) {
    this.animationFrameId = null;
    this.dataArray = null;

    this.backgroundColor = options.backgroundColor || 'rgb(0, 0, 0)';
    this.height = options.height || 300;
    this.lineWidth = options.lineWidth || 2;
    this.strokeStyle = options.strokeStyle || 'rgb(0, 0, 0)';
    this.type = options.type === 'frequency' ? FREQUENCY : WAVE;
    this.width = options.width || 300;

    let canvas = document.getElementById(canvasId);
    this.canvasCtx = canvas.getContext('2d');

    canvas.width = this.width;
    canvas.height = this.height;
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
    this.type = type === 'frequency' ? FREQUENCY : WAVE;
  }

  render (analyser) {
    this.dataArray = this.initByteBuffer(analyser.frequencyBinCount);

    switch(this.type) {
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
    let { width, height, strokeStyle, lineWidth } = this;

    canvasCtx.strokeStyle = strokeStyle;
    canvasCtx.lineWidth = lineWidth;

    for (let i = 0; i < bufferLength; i++) {
      let y = height / 2 + dataArray[i] * 200;

      if (i === 0) {
        x = 0;
        canvasCtx.clearRect(0, 0, width, height);

        canvasCtx.fillStyle = this.backgroundColor;
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
    let { width, height, backgroundColor} = this;
    let bufferLength = dataArray.length;

    let barHeight;
    let barWidth = width / bufferLength;
    let x = 0;

    canvasCtx.fillStyle = backgroundColor;
    canvasCtx.fillRect(0, 0, width, height);

    for(let i = 0; i < bufferLength; i++) {
      barHeight = - dataArray[i] * 2;

      canvasCtx.fillStyle = `rgb(${~~(255 - Math.pow(-barHeight / 10, 2))}, 50, 50)`;
      canvasCtx.fillRect(x, height, barWidth, barHeight - height / 2);

      x += barWidth + 1;
    }
  }
}