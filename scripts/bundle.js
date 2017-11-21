(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var FILTER_PARAMS = ['type', 'frequency', 'gain', 'detune', 'Q'];
var COMPRESSOR_PARAMS = ['threshold', 'knee', 'ratio', 'attack', 'release'];
var DEFAULT_OPTIONS = {
  threshold: -50,
  knee: 40,
  ratio: 12,
  reduction: -20,
  attack: 0,
  release: 0.25,
  Q: 8.30,
  frequency: 355,
  gain: 3.0,
  type: 'bandpass'
};

var NoiseGateNode = function () {
  function NoiseGateNode(audioCtx) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, NoiseGateNode);

    options = Object.assign({}, DEFAULT_OPTIONS, options);

    var compressorPramas = this.selectParams(options, COMPRESSOR_PARAMS);
    var filterPramas = this.selectParams(options, FILTER_PARAMS);

    this.compressor = new DynamicsCompressorNode(audioCtx, compressorPramas);
    this.filter = new BiquadFilterNode(audioCtx, filterPramas);

    this.compressor.connect(this.filter);

    return this.filter;
  }

  _createClass(NoiseGateNode, [{
    key: 'selectParams',
    value: function selectParams(object, filterArr) {
      return Object.keys(object).reduce(function (opt, p) {
        if (filterArr.includes(p)) {
          opt[p] = object[p];
        }
        return opt;
      }, {});
    }
  }, {
    key: 'setParams',
    value: function setParams(node, audioParams) {
      for (var param in audioParams) {
        var value = audioParams[param];
        if (node[param] instanceof AudioParam) {
          node[param].value = value;
        } else {
          node[param] = value;
        }
      }
    }
  }]);

  return NoiseGateNode;
}();

exports = module.exports = NoiseGateNode;

},{}],2:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _noiseGate = require('noise-gate');

var _noiseGate2 = _interopRequireDefault(_noiseGate);

var _audioVisualizer = require('./audio-visualizer.js');

var _audioVisualizer2 = _interopRequireDefault(_audioVisualizer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

window.AudioContext = window.AudioContext || window.webkitAudioContext;

var audioCtx = new AudioContext();
var URLs = {
  blueyellow: 'audios/blueyellow.wav',
  techno: 'audios/techno.wav',
  organ: 'audios/organ-echo-chords.wav'
};

function _loadSound(url) {
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = resolve;
    xhr.onerror = reject;

    xhr.send();
  });
}

var App = function () {
  function App(audioCtx) {
    var _this = this;

    _classCallCheck(this, App);

    this.stream = null;
    this.source = null;
    this.context = audioCtx;
    this.chunks = [];
    this.applyNoiseGate = true;

    this.visualizer = new _audioVisualizer2.default('visualizer', {
      type: 'wave',
      width: 700, height: 500,
      strokeStyle: 'rgb(255, 255, 255)'
    });

    this.getUserMedia();

    document.getElementById('record-button').addEventListener('change', function (event) {
      if (!_this.stream || !_this.stream.active) {
        alert('Require to access to your microphone.');
        event.target.checked = false;
        return false;
      }

      if (!_this.mediaRecorder || _this.mediaRecorder.stream.id !== _this.stream.id) {
        _this.mediaRecorder = new MediaRecorder(_this.stream);
        _this.mediaRecorder.onstop = _this.onStop.bind(_this);
        _this.mediaRecorder.ondataavailable = _this.onDataAvailable.bind(_this);
      }

      if (event.target.checked) {
        _this.mediaRecorder.start();
      } else {
        _this.mediaRecorder.stop();
      }
    }, false);

    document.getElementsByName('analyser-type').forEach(function (input) {
      input.addEventListener('change', function (event) {
        _this.visualizer.setType(event.target.value);
      });
    });

    document.getElementById('input-check').addEventListener('change', function (event) {
      if (event.target.checked) {
        _this.stopAudioSource();
        _this.getUserMedia();
      } else {
        _this.stopUserMedia();
        _this.loadSound(URLs.organ);
      }
    }, false);

    document.getElementById('noise-gate').addEventListener('change', function (event) {
      _this.applyNoiseGate = !!event.target.checked;
    }, false);
  }

  _createClass(App, [{
    key: 'onStop',
    value: function onStop(e) {
      var _this2 = this;

      var blob = new Blob(this.chunks, { 'type': 'audio/ogg; codecs=opus' });
      var audioURL = window.URL.createObjectURL(blob);
      this.chunks = [];

      this.loadSound(audioURL, function () {
        _this2.stopAudioSource();
        _this2.getUserMedia();
      });
    }
  }, {
    key: 'onDataAvailable',
    value: function onDataAvailable(e) {
      console.log('ondataavailable', e.data);
      this.chunks.push(e.data);
    }
  }, {
    key: 'loadSound',
    value: function loadSound(url, onended) {
      var _this3 = this;

      return _loadSound(url).then(function (event) {
        var response = event.target.response;


        _this3.context.decodeAudioData(response, function (buffer) {
          var source = new AudioBufferSourceNode(_this3.context, { buffer: buffer });
          var analyser = new AnalyserNode(_this3.context);

          if (_this3.applyNoiseGate) {
            var noiseGate = new _noiseGate2.default(_this3.context);

            source.connect(noiseGate);
            noiseGate.connect(analyser);
          } else {
            source.connect(analyser);
          }

          analyser.connect(_this3.context.destination);
          source.start();
          source.onended = onended;

          _this3.visualizer.connect(analyser);
          _this3.source = source;
        });
      }).catch(function (e) {
        return console.log(e);
      });
    }
  }, {
    key: 'stopAudioSource',
    value: function stopAudioSource() {
      if (this.source) {
        this.source.stop();
      }
    }
  }, {
    key: 'stopUserMedia',
    value: function stopUserMedia() {
      if (this.stream && this.stream.active) {
        var tracks = this.stream.getTracks();
        tracks.forEach(function (track) {
          return track.stop();
        });
      }
    }
  }, {
    key: 'getUserMedia',
    value: function getUserMedia() {
      var _this4 = this;

      this.stopUserMedia();
      navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
        _this4.stream = stream;
        var source = _this4.context.createMediaStreamSource(stream);
        var analyser = new AnalyserNode(_this4.context);

        if (_this4.applyNoiseGate) {
          var noiseGate = new _noiseGate2.default(_this4.context);
          source.connect(noiseGate);
          noiseGate.connect(analyser);
        } else {
          source.connect(analyser);
        }
        analyser.connect(_this4.context.destination);

        _this4.visualizer.connect(analyser);

        _this4.source = source;
      }).catch(function (e) {
        console.log(e);
      });
    }
  }]);

  return App;
}();

new App(audioCtx);

},{"./audio-visualizer.js":3,"noise-gate":1}],3:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var WAVE = 'wave';
var FREQUENCY = 'frequency';

window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
window.cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame;

var DEFAULT = {
  backgroundColor: 'rgb(25, 25, 25)',
  height: 300,
  lineWidth: 2,
  strokeStyle: 'rgb(0, 0, 0)',
  type: FREQUENCY,
  width: 300
};

var AudioVisualizer = function () {
  function AudioVisualizer(canvasId) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, AudioVisualizer);

    this.animationFrameId = null;
    this.dataArray = null;

    this.options = Object.assign({}, DEFAULT, options);

    var canvas = document.getElementById(canvasId);
    this.canvasCtx = canvas.getContext('2d');

    canvas.width = this.options.width;
    canvas.height = this.options.height;
  }

  _createClass(AudioVisualizer, [{
    key: 'initByteBuffer',
    value: function initByteBuffer(frequencyBinCount) {
      if (!this.dataArray || this.dataArray.length !== frequencyBinCount) {
        return new Float32Array(frequencyBinCount);
      }

      return this.dataArray;
    }
  }, {
    key: 'connect',
    value: function connect(analyser) {
      this.updateAnalyser(analyser);
    }
  }, {
    key: 'disconnect',
    value: function disconnect() {
      cancelAnimationFrame(this.animationFrameId);
    }
  }, {
    key: 'updateAnalyser',
    value: function updateAnalyser(analyser) {
      this.render(analyser);

      this.animationFrameId = window.requestAnimationFrame(this.updateAnalyser.bind(this, analyser));
    }
  }, {
    key: 'setType',
    value: function setType(type) {
      this.options.type = type === FREQUENCY ? FREQUENCY : WAVE;
    }
  }, {
    key: 'render',
    value: function render(analyser) {
      this.dataArray = this.initByteBuffer(analyser.frequencyBinCount);

      switch (this.options.type) {
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
  }, {
    key: 'renderWave',
    value: function renderWave(dataArray, canvasCtx) {
      var bufferLength = dataArray.length;
      var x = 0;
      var _options = this.options,
          width = _options.width,
          height = _options.height,
          strokeStyle = _options.strokeStyle,
          lineWidth = _options.lineWidth,
          backgroundColor = _options.backgroundColor;


      canvasCtx.strokeStyle = strokeStyle;
      canvasCtx.lineWidth = lineWidth;

      for (var i = 0; i < bufferLength; i++) {
        var y = height / 2 + dataArray[i] * 200;

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
  }, {
    key: 'renderFrequency',
    value: function renderFrequency(dataArray, canvasCtx) {
      var _options2 = this.options,
          width = _options2.width,
          height = _options2.height,
          backgroundColor = _options2.backgroundColor;

      var bufferLength = dataArray.length;

      var barHeight = void 0;
      var barWidth = width / bufferLength;
      var x = 0;

      canvasCtx.fillStyle = backgroundColor;
      canvasCtx.fillRect(0, 0, width, height);

      for (var i = 0; i < bufferLength; i++) {
        barHeight = -dataArray[i] * 2;

        canvasCtx.fillStyle = 'rgb(' + ~~(255 - Math.pow(-barHeight / 15, 2)) + ', 50, 50)';
        canvasCtx.fillRect(x, height, barWidth, barHeight - height / 2);

        x += barWidth + 1;
      }
    }
  }]);

  return AudioVisualizer;
}();

exports = module.exports = AudioVisualizer;

},{}],4:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var canvas = document.createElement('canvas');
var ctx = canvas.getContext('2d');
var mount = document.querySelector('#visualizer-mount');
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

var ImageAudiolizer = function () {
  function ImageAudiolizer(audioCtx) {
    _classCallCheck(this, ImageAudiolizer);

    this.audioCtx = audioCtx;
    // this.getImage(imageSrc, this.imageOnland);
  }

  _createClass(ImageAudiolizer, [{
    key: 'getImageData',
    value: function getImageData(img) {
      var canvas = document.createElement('canvas');
      var ctx = canvas.getContext('2d');
      var width = img.width,
          height = img.height;


      canvas.width = width || 500;
      canvas.height = height || 500;
      ctx.drawImage(img, 0, 0);

      return ctx.getImageData(0, 0, width, height);
    }
  }, {
    key: 'getImage',
    value: function getImage(url, callback) {
      var img = new Image();
      img.onload = callback.bind(this, img);
      img.src = url;

      return img;
    }
  }, {
    key: 'scaleImageToAudio',
    value: function scaleImageToAudio(arr) {
      return arr.map(function (p) {
        return p / 127.5 - 1;
      });
    }
  }, {
    key: 'float32ArrayToAudioBuffer',
    value: function float32ArrayToAudioBuffer(audioBuffer, imgArray) {
      var channelNumber = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

      var array = this.scaleImageToAudio(imgArray);
      audioBuffer.copyToChannel(array, channelNumber);

      return audioBuffer;
    }
  }, {
    key: 'toAudioBuffer',
    value: function toAudioBuffer(arrays) {
      var audioBuffer = this.audioCtx.createBuffer(arrays.length, arrays[0].length, this.audioCtx.sampleRate);

      for (var i = 0; i < arrays.length; i++) {
        audioBuffer = this.float32ArrayToAudioBuffer(audioBuffer, arrays[i], i);
      }

      return audioBuffer;
    }
  }, {
    key: 'separateColorLayer',
    value: function separateColorLayer(imgArray) {
      var arrays = [];

      arrays[0] = imgArray.filter(function (_, i) {
        return (i + 1) % 4 == 1;
      });
      arrays[1] = imgArray.filter(function (_, i) {
        return (i + 1) % 4 == 2;
      });
      arrays[2] = imgArray.filter(function (_, i) {
        return (i + 1) % 4 == 3;
      });
      arrays[3] = imgArray.filter(function (_, i) {
        return (i + 1) % 4 == 0;
      });

      return arrays;
    }
  }, {
    key: 'imageOnland',
    value: function imageOnland(img) {
      var idata = this.getImageData(img);

      var imgFloatArray = new Float32Array(idata.data);
      var arrays = this.separateColorLayer(imgFloatArray);

      var audioBuffer = this.toAudioBuffer(arrays);

      audioVisualizer.visualize(audioBuffer);
    }
  }]);

  return ImageAudiolizer;
}();

var ia = new ImageAudiolizer(new AudioContext());
// ia.getImage('./images/serena.png', ia.imageOnland);

},{}],5:[function(require,module,exports){
'use strict';

(function () {
  var promisifiedOldGUM = function promisifiedOldGUM(constraints, successCallback, errorCallback) {

    var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

    if (!getUserMedia) {
      return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
    }

    return new Promise(function (successCallback, errorCallback) {
      getUserMedia.call(navigator, constraints, successCallback, errorCallback);
    });
  };

  if (navigator.mediaDevices === undefined) {
    navigator.mediaDevices = {};
  }

  if (navigator.mediaDevices.getUserMedia === undefined) {
    navigator.mediaDevices.getUserMedia = promisifiedOldGUM;
  }
})();

},{}],6:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var FILTER_PARAMS = ['type', 'frequency', 'gain', 'detune', 'Q'];
var COMPRESSOR_PARAMS = ['threshold', 'knee', 'ratio', 'attack', 'release'];
var DEFAULT_OPTIONS = {
  threshold: -50,
  knee: 40,
  ratio: 12,
  reduction: -20,
  attack: 0,
  release: 0.25,
  Q: 8.30,
  frequency: 355,
  gain: 3.0,
  type: 'bandpass'
};

var NoiseGateNode = function () {
  function NoiseGateNode(audioCtx) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, NoiseGateNode);

    options = Object.assign({}, DEFAULT_OPTIONS, options);

    var compressorPramas = this.selectParams(options, COMPRESSOR_PARAMS);
    var filterPramas = this.selectParams(options, FILTER_PARAMS);

    this.compressor = new DynamicsCompressorNode(audioCtx, compressorPramas);
    this.filter = new BiquadFilterNode(audioCtx, filterPramas);

    this.compressor.connect(this.filter);

    return this.filter;
  }

  _createClass(NoiseGateNode, [{
    key: 'selectParams',
    value: function selectParams(object, filterArr) {
      return Object.keys(object).reduce(function (opt, p) {
        if (filterArr.includes(p)) {
          opt[p] = object[p];
        }
        return opt;
      }, {});
    }
  }, {
    key: 'setParams',
    value: function setParams(node, audioParams) {
      for (var param in audioParams) {
        var value = audioParams[param];
        if (node[param] instanceof AudioParam) {
          node[param].value = value;
        } else {
          node[param] = value;
        }
      }
    }
  }]);

  return NoiseGateNode;
}();

},{}],7:[function(require,module,exports){
"use strict";

function crossfade(value) {
  // equal-power crossfade
  var gain1 = Math.cos(value * 0.5 * Math.PI);
  var gain2 = Math.cos((1.0 - value) * 0.5 * Math.PI);

  dryGain.gain.value = gain1;
  wetGain.gain.value = gain2;
}

function convertToMono(input) {
  var splitter = audioCtx.createChannelSplitter(2);
  var merger = audioCtx.createChannelMerger(2);

  input.connect(splitter);
  splitter.connect(merger, 0, 0);
  splitter.connect(merger, 0, 1);

  return merger;
}

function initStream(mediaStreamSource) {
  var compressor = audioCtx.createDynamicsCompressor();
  compressor.threshold.value = -50;
  compressor.knee.value = 40;
  compressor.ratio.value = 12;
  compressor.reduction.value = -20;
  compressor.attack.value = 0;
  compressor.release.value = 0.25;

  var filter = audioCtx.createBiquadFilter();
  filter.Q.value = 8.30;
  filter.frequency.value = 355;
  filter.gain.value = 3.0;
  filter.type = 'bandpass';
  filter.connect(compressor);

  // compressor.connect(audioCtx.destination);
  // filter.connect(audioCtx.destination);

  // let mediaStreamSource = audioCtx.createMediaStreamSource(stream);
  // mediaStreamSource.connect(compressor);
  mediaStreamSource.connect(filter);

  return filter;
}

function gotStream(stream) {
  var input = audioCtx.createMediaStreamSource(stream);
  var audioInput = convertToMono(input);

  // if (useFeedbackReduction) {
  //   audioInput.connect(createLPInputFilter());
  //   audioInput = lpInputFilter;
  // }
  // create mix gain nodes
  outputMix = audioCtx.createGain();
  dryGain = audioCtx.createGain();
  wetGain = audioCtx.createGain();
  // effectInput = audioCtx.createGain();
  audioInput.connect(dryGain);
  // audioInput.connect(analyser1);
  // audioInput.connect(effectInput);
  dryGain.connect(outputMix);
  wetGain.connect(outputMix);
  outputMix.connect(audioCtx.destination);
  // outputMix.connect(analyser2);
  crossfade(1.0);
  // changeEffect();

  var currentEffectNode = createNoiseGate();

  audioInput.connect(currentEffectNode);

  return audioInput;
}

function createNoiseGate() {
  var inputNode = audioCtx.createGain();
  var rectifier = audioCtx.createWaveShaper();
  var ngFollower = audioCtx.createBiquadFilter();
  var noiseGate = audioCtx.createWaveShaper();
  var gateGain = audioCtx.createGain();

  var bufferLength = 65536;
  var halfBufferLength = bufferLength / 2;

  // min 0, max 0.1, step 0.001, value 0.01
  // let floor = 0.012;
  var floor = 0.1;

  ngFollower.type = "lowpass";
  // min 0.25, max 20, step 0.25, value 10
  ngFollower.frequency.value = 13.0;

  noiseGate.curve = generateNoiseFloorCurve(parseFloat(floor), bufferLength);

  var curve = new Float32Array(bufferLength);
  for (var i = 0; i < bufferLength; i++) {
    curve[i] = Math.abs(i - halfBufferLength) / halfBufferLength;
  }
  rectifier.curve = curve;
  rectifier.connect(ngFollower);

  ngFollower.connect(noiseGate);

  gateGain.gain.value = 0.0;
  noiseGate.connect(gateGain.gain);

  // missing wetGain
  gateGain.connect(wetGain);

  inputNode.connect(rectifier);
  inputNode.connect(gateGain);

  return inputNode;
}

function generateNoiseFloorCurve(floor, bufferLength) {
  // "floor" is 0...1
  // min 0, max 0.1, step 0.001, value 0.01

  var halfLength = bufferLength / 2;

  var curve = new Float32Array(bufferLength);
  var mappedFloor = floor * halfLength;

  for (var i = 0; i < halfLength; i++) {
    var value = i < mappedFloor ? 0 : 1;

    curve[halfLength - i] = -value;
    curve[halfLength + i] = value;
  }
  curve[0] = curve[1]; // fixing up the end.

  return curve;
}

},{}]},{},[2,3,4,5,6,7])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIm5vZGVfbW9kdWxlcy9ub2lzZS1nYXRlL2luZGV4LmpzIiwic2NyaXB0cy5iYWJlbC9hcHAuanMiLCJzY3JpcHRzLmJhYmVsL2F1ZGlvLXZpc3VhbGl6ZXIuanMiLCJzY3JpcHRzLmJhYmVsL2ltYWdlLWF1ZGlvbGl6ZXIuanMiLCJzY3JpcHRzLmJhYmVsL21lZGlhRGV2aWNlcy1nZXRVc2VyTWVkaWEtcG9seWZpbGwuanMiLCJzY3JpcHRzLmJhYmVsL25vaXNlLWdhdGUtbm9kZS5qcyIsInNjcmlwdHMuYmFiZWwvbm9pc2UtZ2F0ZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7OztBQ0FBLElBQU0sZ0JBQWdCLENBQUMsTUFBRCxFQUFTLFdBQVQsRUFBc0IsTUFBdEIsRUFBOEIsUUFBOUIsRUFBd0MsR0FBeEMsQ0FBdEI7QUFDQSxJQUFNLG9CQUFvQixDQUFDLFdBQUQsRUFBYyxNQUFkLEVBQXNCLE9BQXRCLEVBQStCLFFBQS9CLEVBQXlDLFNBQXpDLENBQTFCO0FBQ0EsSUFBTSxrQkFBa0I7QUFDdEIsYUFBVyxDQUFDLEVBRFU7QUFFdEIsUUFBTSxFQUZnQjtBQUd0QixTQUFPLEVBSGU7QUFJdEIsYUFBVyxDQUFDLEVBSlU7QUFLdEIsVUFBUSxDQUxjO0FBTXRCLFdBQVMsSUFOYTtBQU90QixLQUFHLElBUG1CO0FBUXRCLGFBQVcsR0FSVztBQVN0QixRQUFNLEdBVGdCO0FBVXRCLFFBQU07QUFWZ0IsQ0FBeEI7O0lBYU0sYTtBQUNKLHlCQUFZLFFBQVosRUFBb0M7QUFBQSxRQUFkLE9BQWMsdUVBQUosRUFBSTs7QUFBQTs7QUFDbEMsY0FBVSxPQUFPLE1BQVAsQ0FBYyxFQUFkLEVBQWtCLGVBQWxCLEVBQW1DLE9BQW5DLENBQVY7O0FBRUEsUUFBSSxtQkFBbUIsS0FBSyxZQUFMLENBQWtCLE9BQWxCLEVBQTJCLGlCQUEzQixDQUF2QjtBQUNBLFFBQUksZUFBZSxLQUFLLFlBQUwsQ0FBa0IsT0FBbEIsRUFBMkIsYUFBM0IsQ0FBbkI7O0FBRUEsU0FBSyxVQUFMLEdBQWtCLElBQUksc0JBQUosQ0FBMkIsUUFBM0IsRUFBcUMsZ0JBQXJDLENBQWxCO0FBQ0EsU0FBSyxNQUFMLEdBQWMsSUFBSSxnQkFBSixDQUFxQixRQUFyQixFQUErQixZQUEvQixDQUFkOztBQUVBLFNBQUssVUFBTCxDQUFnQixPQUFoQixDQUF3QixLQUFLLE1BQTdCOztBQUVBLFdBQU8sS0FBSyxNQUFaO0FBQ0Q7Ozs7aUNBRVksTSxFQUFRLFMsRUFBVztBQUM5QixhQUFPLE9BQU8sSUFBUCxDQUFZLE1BQVosRUFBb0IsTUFBcEIsQ0FBMkIsVUFBVSxHQUFWLEVBQWUsQ0FBZixFQUFrQjtBQUNsRCxZQUFJLFVBQVUsUUFBVixDQUFtQixDQUFuQixDQUFKLEVBQTJCO0FBQ3pCLGNBQUksQ0FBSixJQUFTLE9BQU8sQ0FBUCxDQUFUO0FBQ0Q7QUFDRCxlQUFPLEdBQVA7QUFDRCxPQUxNLEVBS0osRUFMSSxDQUFQO0FBTUQ7Ozs4QkFFUyxJLEVBQU0sVyxFQUFhO0FBQzNCLFdBQUssSUFBSSxLQUFULElBQWtCLFdBQWxCLEVBQStCO0FBQzdCLFlBQUksUUFBUSxZQUFZLEtBQVosQ0FBWjtBQUNBLFlBQUksS0FBSyxLQUFMLGFBQXVCLFVBQTNCLEVBQXVDO0FBQ3JDLGVBQUssS0FBTCxFQUFZLEtBQVosR0FBb0IsS0FBcEI7QUFDRCxTQUZELE1BRU87QUFDTCxlQUFLLEtBQUwsSUFBYyxLQUFkO0FBQ0Q7QUFDRjtBQUNGOzs7Ozs7QUFHSCxVQUFVLE9BQU8sT0FBUCxHQUFpQixhQUEzQjs7Ozs7OztBQ25EQTs7OztBQUNBOzs7Ozs7OztBQUVBLE9BQU8sWUFBUCxHQUFzQixPQUFPLFlBQVAsSUFBdUIsT0FBTyxrQkFBcEQ7O0FBRUEsSUFBTSxXQUFXLElBQUksWUFBSixFQUFqQjtBQUNBLElBQU0sT0FBTztBQUNYLGNBQVksdUJBREQ7QUFFWCxVQUFRLG1CQUZHO0FBR1gsU0FBTztBQUhJLENBQWI7O0FBTUEsU0FBUyxVQUFULENBQW1CLEdBQW5CLEVBQXdCO0FBQ3RCLFNBQU8sSUFBSSxPQUFKLENBQVksVUFBVSxPQUFWLEVBQW1CLE1BQW5CLEVBQTJCO0FBQzVDLFFBQUksTUFBTSxJQUFJLGNBQUosRUFBVjtBQUNBLFFBQUksSUFBSixDQUFTLEtBQVQsRUFBZ0IsR0FBaEIsRUFBcUIsSUFBckI7QUFDQSxRQUFJLFlBQUosR0FBbUIsYUFBbkI7QUFDQSxRQUFJLE1BQUosR0FBYSxPQUFiO0FBQ0EsUUFBSSxPQUFKLEdBQWMsTUFBZDs7QUFFQSxRQUFJLElBQUo7QUFDRCxHQVJNLENBQVA7QUFTRDs7SUFFSyxHO0FBQ0osZUFBWSxRQUFaLEVBQXNCO0FBQUE7O0FBQUE7O0FBQ3BCLFNBQUssTUFBTCxHQUFjLElBQWQ7QUFDQSxTQUFLLE1BQUwsR0FBYyxJQUFkO0FBQ0EsU0FBSyxPQUFMLEdBQWUsUUFBZjtBQUNBLFNBQUssTUFBTCxHQUFjLEVBQWQ7QUFDQSxTQUFLLGNBQUwsR0FBc0IsSUFBdEI7O0FBRUEsU0FBSyxVQUFMLEdBQWtCLDhCQUFvQixZQUFwQixFQUFrQztBQUNsRCxZQUFNLE1BRDRDO0FBRWxELGFBQU8sR0FGMkMsRUFFdEMsUUFBUSxHQUY4QjtBQUdsRCxtQkFBYTtBQUhxQyxLQUFsQyxDQUFsQjs7QUFNQSxTQUFLLFlBQUw7O0FBRUEsYUFBUyxjQUFULENBQXdCLGVBQXhCLEVBQXlDLGdCQUF6QyxDQUEwRCxRQUExRCxFQUFvRSxpQkFBUztBQUMzRSxVQUFJLENBQUMsTUFBSyxNQUFOLElBQWdCLENBQUMsTUFBSyxNQUFMLENBQVksTUFBakMsRUFBeUM7QUFDdkMsY0FBTSx1Q0FBTjtBQUNBLGNBQU0sTUFBTixDQUFhLE9BQWIsR0FBdUIsS0FBdkI7QUFDQSxlQUFPLEtBQVA7QUFDRDs7QUFFRCxVQUFJLENBQUMsTUFBSyxhQUFOLElBQXNCLE1BQUssYUFBTCxDQUFtQixNQUFuQixDQUEwQixFQUExQixLQUFpQyxNQUFLLE1BQUwsQ0FBWSxFQUF2RSxFQUEyRTtBQUN6RSxjQUFLLGFBQUwsR0FBcUIsSUFBSSxhQUFKLENBQWtCLE1BQUssTUFBdkIsQ0FBckI7QUFDQSxjQUFLLGFBQUwsQ0FBbUIsTUFBbkIsR0FBNEIsTUFBSyxNQUFMLENBQVksSUFBWixPQUE1QjtBQUNBLGNBQUssYUFBTCxDQUFtQixlQUFuQixHQUFxQyxNQUFLLGVBQUwsQ0FBcUIsSUFBckIsT0FBckM7QUFDRDs7QUFFRCxVQUFJLE1BQU0sTUFBTixDQUFhLE9BQWpCLEVBQTBCO0FBQ3hCLGNBQUssYUFBTCxDQUFtQixLQUFuQjtBQUNELE9BRkQsTUFFTztBQUNMLGNBQUssYUFBTCxDQUFtQixJQUFuQjtBQUNEO0FBQ0YsS0FsQkQsRUFrQkcsS0FsQkg7O0FBb0JBLGFBQVMsaUJBQVQsQ0FBMkIsZUFBM0IsRUFBNEMsT0FBNUMsQ0FBb0QsaUJBQVM7QUFDM0QsWUFBTSxnQkFBTixDQUF1QixRQUF2QixFQUFpQyxpQkFBUztBQUN4QyxjQUFLLFVBQUwsQ0FBZ0IsT0FBaEIsQ0FBd0IsTUFBTSxNQUFOLENBQWEsS0FBckM7QUFDRCxPQUZEO0FBR0QsS0FKRDs7QUFNQSxhQUFTLGNBQVQsQ0FBd0IsYUFBeEIsRUFBdUMsZ0JBQXZDLENBQXdELFFBQXhELEVBQWtFLGlCQUFTO0FBQ3pFLFVBQUksTUFBTSxNQUFOLENBQWEsT0FBakIsRUFBMEI7QUFDeEIsY0FBSyxlQUFMO0FBQ0EsY0FBSyxZQUFMO0FBQ0QsT0FIRCxNQUdPO0FBQ0wsY0FBSyxhQUFMO0FBQ0EsY0FBSyxTQUFMLENBQWUsS0FBSyxLQUFwQjtBQUNEO0FBQ0YsS0FSRCxFQVFHLEtBUkg7O0FBVUEsYUFBUyxjQUFULENBQXdCLFlBQXhCLEVBQXNDLGdCQUF0QyxDQUF1RCxRQUF2RCxFQUFpRSxpQkFBUztBQUN4RSxZQUFLLGNBQUwsR0FBc0IsQ0FBQyxDQUFDLE1BQU0sTUFBTixDQUFhLE9BQXJDO0FBQ0QsS0FGRCxFQUVHLEtBRkg7QUFHRDs7OzsyQkFFTyxDLEVBQUc7QUFBQTs7QUFDVCxVQUFJLE9BQU8sSUFBSSxJQUFKLENBQVMsS0FBSyxNQUFkLEVBQXNCLEVBQUUsUUFBUyx3QkFBWCxFQUF0QixDQUFYO0FBQ0EsVUFBSSxXQUFXLE9BQU8sR0FBUCxDQUFXLGVBQVgsQ0FBMkIsSUFBM0IsQ0FBZjtBQUNBLFdBQUssTUFBTCxHQUFjLEVBQWQ7O0FBRUEsV0FBSyxTQUFMLENBQWUsUUFBZixFQUF5QixZQUFNO0FBQzdCLGVBQUssZUFBTDtBQUNBLGVBQUssWUFBTDtBQUNELE9BSEQ7QUFJRDs7O29DQUVnQixDLEVBQUc7QUFDbEIsY0FBUSxHQUFSLENBQVksaUJBQVosRUFBK0IsRUFBRSxJQUFqQztBQUNBLFdBQUssTUFBTCxDQUFZLElBQVosQ0FBaUIsRUFBRSxJQUFuQjtBQUNEOzs7OEJBRVMsRyxFQUFLLE8sRUFBUztBQUFBOztBQUN0QixhQUFPLFdBQVUsR0FBVixFQUNOLElBRE0sQ0FDRCxVQUFDLEtBQUQsRUFBVztBQUFBLFlBQ1QsUUFEUyxHQUNJLE1BQU0sTUFEVixDQUNULFFBRFM7OztBQUdmLGVBQUssT0FBTCxDQUFhLGVBQWIsQ0FBNkIsUUFBN0IsRUFBdUMsa0JBQVU7QUFDL0MsY0FBSSxTQUFTLElBQUkscUJBQUosQ0FBMEIsT0FBSyxPQUEvQixFQUF3QyxFQUFFLGNBQUYsRUFBeEMsQ0FBYjtBQUNBLGNBQUksV0FBVyxJQUFJLFlBQUosQ0FBaUIsT0FBSyxPQUF0QixDQUFmOztBQUVBLGNBQUksT0FBSyxjQUFULEVBQXlCO0FBQ3ZCLGdCQUFJLFlBQVksd0JBQWtCLE9BQUssT0FBdkIsQ0FBaEI7O0FBRUEsbUJBQU8sT0FBUCxDQUFlLFNBQWY7QUFDQSxzQkFBVSxPQUFWLENBQWtCLFFBQWxCO0FBQ0QsV0FMRCxNQUtPO0FBQ0wsbUJBQU8sT0FBUCxDQUFlLFFBQWY7QUFDRDs7QUFFRCxtQkFBUyxPQUFULENBQWlCLE9BQUssT0FBTCxDQUFhLFdBQTlCO0FBQ0EsaUJBQU8sS0FBUDtBQUNBLGlCQUFPLE9BQVAsR0FBaUIsT0FBakI7O0FBRUEsaUJBQUssVUFBTCxDQUFnQixPQUFoQixDQUF3QixRQUF4QjtBQUNBLGlCQUFLLE1BQUwsR0FBYyxNQUFkO0FBQ0QsU0FuQkQ7QUFvQkQsT0F4Qk0sRUF5Qk4sS0F6Qk0sQ0F5QkE7QUFBQSxlQUFLLFFBQVEsR0FBUixDQUFZLENBQVosQ0FBTDtBQUFBLE9BekJBLENBQVA7QUEwQkQ7OztzQ0FFaUI7QUFDaEIsVUFBSSxLQUFLLE1BQVQsRUFBaUI7QUFDZixhQUFLLE1BQUwsQ0FBWSxJQUFaO0FBQ0Q7QUFDRjs7O29DQUVlO0FBQ2QsVUFBSSxLQUFLLE1BQUwsSUFBZSxLQUFLLE1BQUwsQ0FBWSxNQUEvQixFQUF1QztBQUNyQyxZQUFJLFNBQVMsS0FBSyxNQUFMLENBQVksU0FBWixFQUFiO0FBQ0EsZUFBTyxPQUFQLENBQWU7QUFBQSxpQkFBUyxNQUFNLElBQU4sRUFBVDtBQUFBLFNBQWY7QUFDRDtBQUNGOzs7bUNBRWM7QUFBQTs7QUFDYixXQUFLLGFBQUw7QUFDQSxnQkFBVSxZQUFWLENBQXVCLFlBQXZCLENBQW9DLEVBQUUsT0FBTyxJQUFULEVBQXBDLEVBQ0MsSUFERCxDQUNNLFVBQUMsTUFBRCxFQUFZO0FBQ2hCLGVBQUssTUFBTCxHQUFjLE1BQWQ7QUFDQSxZQUFJLFNBQVMsT0FBSyxPQUFMLENBQWEsdUJBQWIsQ0FBcUMsTUFBckMsQ0FBYjtBQUNBLFlBQUksV0FBVyxJQUFJLFlBQUosQ0FBaUIsT0FBSyxPQUF0QixDQUFmOztBQUVBLFlBQUksT0FBSyxjQUFULEVBQXlCO0FBQ3ZCLGNBQUksWUFBWSx3QkFBa0IsT0FBSyxPQUF2QixDQUFoQjtBQUNBLGlCQUFPLE9BQVAsQ0FBZSxTQUFmO0FBQ0Esb0JBQVUsT0FBVixDQUFrQixRQUFsQjtBQUNELFNBSkQsTUFJTztBQUNMLGlCQUFPLE9BQVAsQ0FBZSxRQUFmO0FBQ0Q7QUFDRCxpQkFBUyxPQUFULENBQWlCLE9BQUssT0FBTCxDQUFhLFdBQTlCOztBQUVBLGVBQUssVUFBTCxDQUFnQixPQUFoQixDQUF3QixRQUF4Qjs7QUFFQSxlQUFLLE1BQUwsR0FBYyxNQUFkO0FBQ0QsT0FsQkQsRUFtQkMsS0FuQkQsQ0FtQk8sVUFBQyxDQUFELEVBQU87QUFDWixnQkFBUSxHQUFSLENBQVksQ0FBWjtBQUNELE9BckJEO0FBc0JEOzs7Ozs7QUFHSCxJQUFJLEdBQUosQ0FBUSxRQUFSOzs7Ozs7Ozs7QUN0S0EsSUFBTSxPQUFPLE1BQWI7QUFDQSxJQUFNLFlBQVksV0FBbEI7O0FBRUEsT0FBTyxxQkFBUCxHQUErQixPQUFPLHFCQUFQLElBQWdDLE9BQU8sd0JBQXZDLElBQW1FLE9BQU8sMkJBQTFFLElBQXlHLE9BQU8sdUJBQS9JO0FBQ0EsT0FBTyxvQkFBUCxHQUE4QixPQUFPLG9CQUFQLElBQStCLE9BQU8sdUJBQXBFOztBQUVBLElBQU0sVUFBVTtBQUNkLG1CQUFpQixpQkFESDtBQUVkLFVBQVEsR0FGTTtBQUdkLGFBQVcsQ0FIRztBQUlkLGVBQWEsY0FKQztBQUtkLFFBQU0sU0FMUTtBQU1kLFNBQU87QUFOTyxDQUFoQjs7SUFTTSxlO0FBQ0osMkJBQVksUUFBWixFQUFvQztBQUFBLFFBQWQsT0FBYyx1RUFBSixFQUFJOztBQUFBOztBQUNsQyxTQUFLLGdCQUFMLEdBQXdCLElBQXhCO0FBQ0EsU0FBSyxTQUFMLEdBQWlCLElBQWpCOztBQUVBLFNBQUssT0FBTCxHQUFlLE9BQU8sTUFBUCxDQUFjLEVBQWQsRUFBa0IsT0FBbEIsRUFBMkIsT0FBM0IsQ0FBZjs7QUFFQSxRQUFJLFNBQVMsU0FBUyxjQUFULENBQXdCLFFBQXhCLENBQWI7QUFDQSxTQUFLLFNBQUwsR0FBaUIsT0FBTyxVQUFQLENBQWtCLElBQWxCLENBQWpCOztBQUVBLFdBQU8sS0FBUCxHQUFlLEtBQUssT0FBTCxDQUFhLEtBQTVCO0FBQ0EsV0FBTyxNQUFQLEdBQWdCLEtBQUssT0FBTCxDQUFhLE1BQTdCO0FBQ0Q7Ozs7bUNBRWUsaUIsRUFBbUI7QUFDakMsVUFBSSxDQUFDLEtBQUssU0FBTixJQUFtQixLQUFLLFNBQUwsQ0FBZSxNQUFmLEtBQTBCLGlCQUFqRCxFQUFvRTtBQUNsRSxlQUFPLElBQUksWUFBSixDQUFpQixpQkFBakIsQ0FBUDtBQUNEOztBQUVELGFBQU8sS0FBSyxTQUFaO0FBQ0Q7Ozs0QkFFUSxRLEVBQVU7QUFDakIsV0FBSyxjQUFMLENBQW9CLFFBQXBCO0FBQ0Q7OztpQ0FFYTtBQUNaLDJCQUFxQixLQUFLLGdCQUExQjtBQUNEOzs7bUNBRWMsUSxFQUFVO0FBQ3ZCLFdBQUssTUFBTCxDQUFZLFFBQVo7O0FBRUEsV0FBSyxnQkFBTCxHQUF3QixPQUFPLHFCQUFQLENBQTZCLEtBQUssY0FBTCxDQUFvQixJQUFwQixDQUF5QixJQUF6QixFQUErQixRQUEvQixDQUE3QixDQUF4QjtBQUNEOzs7NEJBRU8sSSxFQUFNO0FBQ1osV0FBSyxPQUFMLENBQWEsSUFBYixHQUFvQixTQUFTLFNBQVQsR0FBcUIsU0FBckIsR0FBaUMsSUFBckQ7QUFDRDs7OzJCQUVPLFEsRUFBVTtBQUNoQixXQUFLLFNBQUwsR0FBaUIsS0FBSyxjQUFMLENBQW9CLFNBQVMsaUJBQTdCLENBQWpCOztBQUVBLGNBQU8sS0FBSyxPQUFMLENBQWEsSUFBcEI7QUFDRSxhQUFLLElBQUw7QUFDRSxtQkFBUyxzQkFBVCxDQUFnQyxLQUFLLFNBQXJDO0FBQ0EsZUFBSyxVQUFMLENBQWdCLEtBQUssU0FBckIsRUFBZ0MsS0FBSyxTQUFyQztBQUNBO0FBQ0YsYUFBSyxTQUFMO0FBQ0UsbUJBQVMscUJBQVQsQ0FBK0IsS0FBSyxTQUFwQztBQUNBLGVBQUssZUFBTCxDQUFxQixLQUFLLFNBQTFCLEVBQXFDLEtBQUssU0FBMUM7QUFDQTtBQVJKO0FBVUQ7OzsrQkFFVSxTLEVBQVcsUyxFQUFXO0FBQy9CLFVBQUksZUFBZSxVQUFVLE1BQTdCO0FBQ0EsVUFBSSxJQUFJLENBQVI7QUFGK0IscUJBR2tDLEtBQUssT0FIdkM7QUFBQSxVQUd6QixLQUh5QixZQUd6QixLQUh5QjtBQUFBLFVBR2xCLE1BSGtCLFlBR2xCLE1BSGtCO0FBQUEsVUFHVixXQUhVLFlBR1YsV0FIVTtBQUFBLFVBR0csU0FISCxZQUdHLFNBSEg7QUFBQSxVQUdjLGVBSGQsWUFHYyxlQUhkOzs7QUFLL0IsZ0JBQVUsV0FBVixHQUF3QixXQUF4QjtBQUNBLGdCQUFVLFNBQVYsR0FBc0IsU0FBdEI7O0FBRUEsV0FBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLFlBQXBCLEVBQWtDLEdBQWxDLEVBQXVDO0FBQ3JDLFlBQUksSUFBSSxTQUFTLENBQVQsR0FBYSxVQUFVLENBQVYsSUFBZSxHQUFwQzs7QUFFQSxZQUFJLE1BQU0sQ0FBVixFQUFhO0FBQ1gsY0FBSSxDQUFKO0FBQ0Esb0JBQVUsU0FBVixDQUFvQixDQUFwQixFQUF1QixDQUF2QixFQUEwQixLQUExQixFQUFpQyxNQUFqQztBQUNBLG9CQUFVLFNBQVYsR0FBc0IsZUFBdEI7QUFDQSxvQkFBVSxRQUFWLENBQW1CLENBQW5CLEVBQXNCLENBQXRCLEVBQXlCLEtBQXpCLEVBQWdDLE1BQWhDO0FBQ0Esb0JBQVUsU0FBVjs7QUFFQSxvQkFBVSxNQUFWLENBQWlCLENBQWpCLEVBQW9CLENBQXBCO0FBQ0QsU0FSRCxNQVFPO0FBQ0wsb0JBQVUsTUFBVixDQUFpQixDQUFqQixFQUFvQixDQUFwQjtBQUNEOztBQUVELGFBQUssUUFBUSxZQUFiO0FBQ0Q7O0FBRUQsZ0JBQVUsTUFBVjtBQUNEOzs7b0NBRWUsUyxFQUFXLFMsRUFBVztBQUFBLHNCQUNLLEtBQUssT0FEVjtBQUFBLFVBQzlCLEtBRDhCLGFBQzlCLEtBRDhCO0FBQUEsVUFDdkIsTUFEdUIsYUFDdkIsTUFEdUI7QUFBQSxVQUNmLGVBRGUsYUFDZixlQURlOztBQUVwQyxVQUFJLGVBQWUsVUFBVSxNQUE3Qjs7QUFFQSxVQUFJLGtCQUFKO0FBQ0EsVUFBSSxXQUFXLFFBQVEsWUFBdkI7QUFDQSxVQUFJLElBQUksQ0FBUjs7QUFFQSxnQkFBVSxTQUFWLEdBQXNCLGVBQXRCO0FBQ0EsZ0JBQVUsUUFBVixDQUFtQixDQUFuQixFQUFzQixDQUF0QixFQUF5QixLQUF6QixFQUFnQyxNQUFoQzs7QUFFQSxXQUFJLElBQUksSUFBSSxDQUFaLEVBQWUsSUFBSSxZQUFuQixFQUFpQyxHQUFqQyxFQUFzQztBQUNwQyxvQkFBWSxDQUFFLFVBQVUsQ0FBVixDQUFGLEdBQWlCLENBQTdCOztBQUVBLGtCQUFVLFNBQVYsWUFBNkIsQ0FBQyxFQUFFLE1BQU0sS0FBSyxHQUFMLENBQVMsQ0FBQyxTQUFELEdBQWEsRUFBdEIsRUFBMEIsQ0FBMUIsQ0FBUixDQUE5QjtBQUNBLGtCQUFVLFFBQVYsQ0FBbUIsQ0FBbkIsRUFBc0IsTUFBdEIsRUFBOEIsUUFBOUIsRUFBd0MsWUFBWSxTQUFTLENBQTdEOztBQUVBLGFBQUssV0FBVyxDQUFoQjtBQUNEO0FBQ0Y7Ozs7OztBQUdILFVBQVUsT0FBTyxPQUFQLEdBQWlCLGVBQTNCOzs7Ozs7Ozs7QUN6SEEsSUFBSSxTQUFTLFNBQVMsYUFBVCxDQUF1QixRQUF2QixDQUFiO0FBQ0EsSUFBSSxNQUFNLE9BQU8sVUFBUCxDQUFrQixJQUFsQixDQUFWO0FBQ0EsSUFBSSxRQUFRLFNBQVMsYUFBVCxDQUF1QixtQkFBdkIsQ0FBWjtBQUNBLE9BQU8sS0FBUCxHQUFlLEdBQWY7QUFDQSxPQUFPLE1BQVAsR0FBZ0IsR0FBaEI7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0lBRU0sZTtBQUNKLDJCQUFZLFFBQVosRUFBc0I7QUFBQTs7QUFDcEIsU0FBSyxRQUFMLEdBQWdCLFFBQWhCO0FBQ0E7QUFDRDs7OztpQ0FFWSxHLEVBQUs7QUFDaEIsVUFBSSxTQUFTLFNBQVMsYUFBVCxDQUF1QixRQUF2QixDQUFiO0FBQ0EsVUFBSSxNQUFNLE9BQU8sVUFBUCxDQUFrQixJQUFsQixDQUFWO0FBRmdCLFVBR1YsS0FIVSxHQUdRLEdBSFIsQ0FHVixLQUhVO0FBQUEsVUFHSCxNQUhHLEdBR1EsR0FIUixDQUdILE1BSEc7OztBQUtoQixhQUFPLEtBQVAsR0FBZSxTQUFTLEdBQXhCO0FBQ0EsYUFBTyxNQUFQLEdBQWdCLFVBQVUsR0FBMUI7QUFDQSxVQUFJLFNBQUosQ0FBYyxHQUFkLEVBQW1CLENBQW5CLEVBQXNCLENBQXRCOztBQUVBLGFBQU8sSUFBSSxZQUFKLENBQWlCLENBQWpCLEVBQW9CLENBQXBCLEVBQXVCLEtBQXZCLEVBQThCLE1BQTlCLENBQVA7QUFDRDs7OzZCQUVTLEcsRUFBSyxRLEVBQVU7QUFDdkIsVUFBSSxNQUFNLElBQUksS0FBSixFQUFWO0FBQ0EsVUFBSSxNQUFKLEdBQWEsU0FBUyxJQUFULENBQWMsSUFBZCxFQUFvQixHQUFwQixDQUFiO0FBQ0EsVUFBSSxHQUFKLEdBQVUsR0FBVjs7QUFFQSxhQUFPLEdBQVA7QUFDRDs7O3NDQUVrQixHLEVBQUs7QUFDdEIsYUFBTyxJQUFJLEdBQUosQ0FBUTtBQUFBLGVBQU8sSUFBSSxLQUFMLEdBQWMsQ0FBcEI7QUFBQSxPQUFSLENBQVA7QUFDRDs7OzhDQUUwQixXLEVBQWEsUSxFQUE2QjtBQUFBLFVBQW5CLGFBQW1CLHVFQUFILENBQUc7O0FBQ25FLFVBQUksUUFBUSxLQUFLLGlCQUFMLENBQXVCLFFBQXZCLENBQVo7QUFDQSxrQkFBWSxhQUFaLENBQTBCLEtBQTFCLEVBQWlDLGFBQWpDOztBQUVBLGFBQU8sV0FBUDtBQUNEOzs7a0NBRWEsTSxFQUFRO0FBQ3BCLFVBQUksY0FBYyxLQUFLLFFBQUwsQ0FBYyxZQUFkLENBQTJCLE9BQU8sTUFBbEMsRUFBMEMsT0FBTyxDQUFQLEVBQVUsTUFBcEQsRUFBNEQsS0FBSyxRQUFMLENBQWMsVUFBMUUsQ0FBbEI7O0FBRUEsV0FBSSxJQUFJLElBQUksQ0FBWixFQUFlLElBQUksT0FBTyxNQUExQixFQUFrQyxHQUFsQyxFQUF1QztBQUNyQyxzQkFBYyxLQUFLLHlCQUFMLENBQStCLFdBQS9CLEVBQTRDLE9BQU8sQ0FBUCxDQUE1QyxFQUF1RCxDQUF2RCxDQUFkO0FBQ0Q7O0FBRUQsYUFBTyxXQUFQO0FBQ0Q7Ozt1Q0FFa0IsUSxFQUFVO0FBQzNCLFVBQUksU0FBUyxFQUFiOztBQUVBLGFBQU8sQ0FBUCxJQUFZLFNBQVMsTUFBVCxDQUFnQixVQUFDLENBQUQsRUFBSSxDQUFKO0FBQUEsZUFBVSxDQUFDLElBQUUsQ0FBSCxJQUFRLENBQVIsSUFBYSxDQUF2QjtBQUFBLE9BQWhCLENBQVo7QUFDQSxhQUFPLENBQVAsSUFBWSxTQUFTLE1BQVQsQ0FBZ0IsVUFBQyxDQUFELEVBQUksQ0FBSjtBQUFBLGVBQVUsQ0FBQyxJQUFFLENBQUgsSUFBUSxDQUFSLElBQWEsQ0FBdkI7QUFBQSxPQUFoQixDQUFaO0FBQ0EsYUFBTyxDQUFQLElBQVksU0FBUyxNQUFULENBQWdCLFVBQUMsQ0FBRCxFQUFJLENBQUo7QUFBQSxlQUFVLENBQUMsSUFBRSxDQUFILElBQVEsQ0FBUixJQUFhLENBQXZCO0FBQUEsT0FBaEIsQ0FBWjtBQUNBLGFBQU8sQ0FBUCxJQUFZLFNBQVMsTUFBVCxDQUFnQixVQUFDLENBQUQsRUFBSSxDQUFKO0FBQUEsZUFBVSxDQUFDLElBQUUsQ0FBSCxJQUFRLENBQVIsSUFBYSxDQUF2QjtBQUFBLE9BQWhCLENBQVo7O0FBRUEsYUFBTyxNQUFQO0FBQ0Q7OztnQ0FFWSxHLEVBQUs7QUFDaEIsVUFBSSxRQUFRLEtBQUssWUFBTCxDQUFrQixHQUFsQixDQUFaOztBQUVBLFVBQUksZ0JBQWdCLElBQUksWUFBSixDQUFpQixNQUFNLElBQXZCLENBQXBCO0FBQ0EsVUFBSSxTQUFTLEtBQUssa0JBQUwsQ0FBd0IsYUFBeEIsQ0FBYjs7QUFFQSxVQUFJLGNBQWMsS0FBSyxhQUFMLENBQW1CLE1BQW5CLENBQWxCOztBQUVBLHNCQUFnQixTQUFoQixDQUEwQixXQUExQjtBQUNEOzs7Ozs7QUFHSCxJQUFNLEtBQUssSUFBSSxlQUFKLENBQW9CLElBQUksWUFBSixFQUFwQixDQUFYO0FBQ0E7Ozs7O0FDeEZBLENBQUMsWUFBVztBQUNWLE1BQUksb0JBQW9CLFNBQXBCLGlCQUFvQixDQUFTLFdBQVQsRUFBc0IsZUFBdEIsRUFBdUMsYUFBdkMsRUFBc0Q7O0FBRTVFLFFBQUksZUFBZ0IsVUFBVSxZQUFWLElBQ2xCLFVBQVUsa0JBRFEsSUFFbEIsVUFBVSxlQUZRLElBR2xCLFVBQVUsY0FIWjs7QUFLQSxRQUFHLENBQUMsWUFBSixFQUFrQjtBQUNoQixhQUFPLFFBQVEsTUFBUixDQUFlLElBQUksS0FBSixDQUFVLGlEQUFWLENBQWYsQ0FBUDtBQUNEOztBQUVELFdBQU8sSUFBSSxPQUFKLENBQVksVUFBUyxlQUFULEVBQTBCLGFBQTFCLEVBQXlDO0FBQzFELG1CQUFhLElBQWIsQ0FBa0IsU0FBbEIsRUFBNkIsV0FBN0IsRUFBMEMsZUFBMUMsRUFBMkQsYUFBM0Q7QUFDRCxLQUZNLENBQVA7QUFHRCxHQWREOztBQWdCQSxNQUFHLFVBQVUsWUFBVixLQUEyQixTQUE5QixFQUF5QztBQUN2QyxjQUFVLFlBQVYsR0FBeUIsRUFBekI7QUFDRDs7QUFFRCxNQUFHLFVBQVUsWUFBVixDQUF1QixZQUF2QixLQUF3QyxTQUEzQyxFQUFzRDtBQUNwRCxjQUFVLFlBQVYsQ0FBdUIsWUFBdkIsR0FBc0MsaUJBQXRDO0FBQ0Q7QUFDRixDQXhCRDs7Ozs7Ozs7O0FDQUEsSUFBTSxnQkFBZ0IsQ0FBQyxNQUFELEVBQVMsV0FBVCxFQUFzQixNQUF0QixFQUE4QixRQUE5QixFQUF3QyxHQUF4QyxDQUF0QjtBQUNBLElBQU0sb0JBQW9CLENBQUMsV0FBRCxFQUFjLE1BQWQsRUFBc0IsT0FBdEIsRUFBK0IsUUFBL0IsRUFBeUMsU0FBekMsQ0FBMUI7QUFDQSxJQUFNLGtCQUFrQjtBQUN0QixhQUFXLENBQUMsRUFEVTtBQUV0QixRQUFNLEVBRmdCO0FBR3RCLFNBQU8sRUFIZTtBQUl0QixhQUFXLENBQUMsRUFKVTtBQUt0QixVQUFRLENBTGM7QUFNdEIsV0FBUyxJQU5hO0FBT3RCLEtBQUcsSUFQbUI7QUFRdEIsYUFBVyxHQVJXO0FBU3RCLFFBQU0sR0FUZ0I7QUFVdEIsUUFBTTtBQVZnQixDQUF4Qjs7SUFhTSxhO0FBQ0oseUJBQVksUUFBWixFQUFvQztBQUFBLFFBQWQsT0FBYyx1RUFBSixFQUFJOztBQUFBOztBQUNsQyxjQUFVLE9BQU8sTUFBUCxDQUFjLEVBQWQsRUFBa0IsZUFBbEIsRUFBbUMsT0FBbkMsQ0FBVjs7QUFFQSxRQUFJLG1CQUFtQixLQUFLLFlBQUwsQ0FBa0IsT0FBbEIsRUFBMkIsaUJBQTNCLENBQXZCO0FBQ0EsUUFBSSxlQUFlLEtBQUssWUFBTCxDQUFrQixPQUFsQixFQUEyQixhQUEzQixDQUFuQjs7QUFFQSxTQUFLLFVBQUwsR0FBa0IsSUFBSSxzQkFBSixDQUEyQixRQUEzQixFQUFxQyxnQkFBckMsQ0FBbEI7QUFDQSxTQUFLLE1BQUwsR0FBYyxJQUFJLGdCQUFKLENBQXFCLFFBQXJCLEVBQStCLFlBQS9CLENBQWQ7O0FBRUEsU0FBSyxVQUFMLENBQWdCLE9BQWhCLENBQXdCLEtBQUssTUFBN0I7O0FBRUEsV0FBTyxLQUFLLE1BQVo7QUFDRDs7OztpQ0FFWSxNLEVBQVEsUyxFQUFXO0FBQzlCLGFBQU8sT0FBTyxJQUFQLENBQVksTUFBWixFQUFvQixNQUFwQixDQUEyQixVQUFVLEdBQVYsRUFBZSxDQUFmLEVBQWtCO0FBQ2xELFlBQUksVUFBVSxRQUFWLENBQW1CLENBQW5CLENBQUosRUFBMkI7QUFDekIsY0FBSSxDQUFKLElBQVMsT0FBTyxDQUFQLENBQVQ7QUFDRDtBQUNELGVBQU8sR0FBUDtBQUNELE9BTE0sRUFLSixFQUxJLENBQVA7QUFNRDs7OzhCQUVTLEksRUFBTSxXLEVBQWE7QUFDM0IsV0FBSyxJQUFJLEtBQVQsSUFBa0IsV0FBbEIsRUFBK0I7QUFDN0IsWUFBSSxRQUFRLFlBQVksS0FBWixDQUFaO0FBQ0EsWUFBSSxLQUFLLEtBQUwsYUFBdUIsVUFBM0IsRUFBdUM7QUFDckMsZUFBSyxLQUFMLEVBQVksS0FBWixHQUFvQixLQUFwQjtBQUNELFNBRkQsTUFFTztBQUNMLGVBQUssS0FBTCxJQUFjLEtBQWQ7QUFDRDtBQUNGO0FBQ0Y7Ozs7Ozs7OztBQ2hESCxTQUFTLFNBQVQsQ0FBbUIsS0FBbkIsRUFBMEI7QUFDeEI7QUFDQSxNQUFJLFFBQVEsS0FBSyxHQUFMLENBQVMsUUFBUSxHQUFSLEdBQWMsS0FBSyxFQUE1QixDQUFaO0FBQ0EsTUFBSSxRQUFRLEtBQUssR0FBTCxDQUFTLENBQUMsTUFBTSxLQUFQLElBQWdCLEdBQWhCLEdBQXNCLEtBQUssRUFBcEMsQ0FBWjs7QUFFQSxVQUFRLElBQVIsQ0FBYSxLQUFiLEdBQXFCLEtBQXJCO0FBQ0EsVUFBUSxJQUFSLENBQWEsS0FBYixHQUFxQixLQUFyQjtBQUNEOztBQUVELFNBQVMsYUFBVCxDQUF1QixLQUF2QixFQUE4QjtBQUM1QixNQUFJLFdBQVcsU0FBUyxxQkFBVCxDQUErQixDQUEvQixDQUFmO0FBQ0EsTUFBSSxTQUFTLFNBQVMsbUJBQVQsQ0FBNkIsQ0FBN0IsQ0FBYjs7QUFFQSxRQUFNLE9BQU4sQ0FBYyxRQUFkO0FBQ0EsV0FBUyxPQUFULENBQWlCLE1BQWpCLEVBQXlCLENBQXpCLEVBQTRCLENBQTVCO0FBQ0EsV0FBUyxPQUFULENBQWlCLE1BQWpCLEVBQXlCLENBQXpCLEVBQTRCLENBQTVCOztBQUVBLFNBQU8sTUFBUDtBQUNEOztBQUVELFNBQVMsVUFBVCxDQUFxQixpQkFBckIsRUFBd0M7QUFDdEMsTUFBSSxhQUFhLFNBQVMsd0JBQVQsRUFBakI7QUFDQSxhQUFXLFNBQVgsQ0FBcUIsS0FBckIsR0FBNkIsQ0FBQyxFQUE5QjtBQUNBLGFBQVcsSUFBWCxDQUFnQixLQUFoQixHQUF3QixFQUF4QjtBQUNBLGFBQVcsS0FBWCxDQUFpQixLQUFqQixHQUF5QixFQUF6QjtBQUNBLGFBQVcsU0FBWCxDQUFxQixLQUFyQixHQUE2QixDQUFDLEVBQTlCO0FBQ0EsYUFBVyxNQUFYLENBQWtCLEtBQWxCLEdBQTBCLENBQTFCO0FBQ0EsYUFBVyxPQUFYLENBQW1CLEtBQW5CLEdBQTJCLElBQTNCOztBQUVBLE1BQUksU0FBUyxTQUFTLGtCQUFULEVBQWI7QUFDQSxTQUFPLENBQVAsQ0FBUyxLQUFULEdBQWlCLElBQWpCO0FBQ0EsU0FBTyxTQUFQLENBQWlCLEtBQWpCLEdBQXlCLEdBQXpCO0FBQ0EsU0FBTyxJQUFQLENBQVksS0FBWixHQUFvQixHQUFwQjtBQUNBLFNBQU8sSUFBUCxHQUFjLFVBQWQ7QUFDQSxTQUFPLE9BQVAsQ0FBZSxVQUFmOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLG9CQUFrQixPQUFsQixDQUEwQixNQUExQjs7QUFFQSxTQUFPLE1BQVA7QUFDRDs7QUFFRCxTQUFTLFNBQVQsQ0FBbUIsTUFBbkIsRUFBMkI7QUFDekIsTUFBSSxRQUFRLFNBQVMsdUJBQVQsQ0FBaUMsTUFBakMsQ0FBWjtBQUNBLE1BQUksYUFBYSxjQUFjLEtBQWQsQ0FBakI7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGNBQVksU0FBUyxVQUFULEVBQVo7QUFDQSxZQUFVLFNBQVMsVUFBVCxFQUFWO0FBQ0EsWUFBVSxTQUFTLFVBQVQsRUFBVjtBQUNBO0FBQ0EsYUFBVyxPQUFYLENBQW1CLE9BQW5CO0FBQ0E7QUFDQTtBQUNBLFVBQVEsT0FBUixDQUFnQixTQUFoQjtBQUNBLFVBQVEsT0FBUixDQUFnQixTQUFoQjtBQUNBLFlBQVUsT0FBVixDQUFrQixTQUFTLFdBQTNCO0FBQ0E7QUFDQSxZQUFVLEdBQVY7QUFDQTs7QUFFQSxNQUFJLG9CQUFvQixpQkFBeEI7O0FBRUEsYUFBVyxPQUFYLENBQW1CLGlCQUFuQjs7QUFFQSxTQUFPLFVBQVA7QUFDRDs7QUFFRCxTQUFTLGVBQVQsR0FBMkI7QUFDekIsTUFBSSxZQUFZLFNBQVMsVUFBVCxFQUFoQjtBQUNBLE1BQUksWUFBWSxTQUFTLGdCQUFULEVBQWhCO0FBQ0EsTUFBSSxhQUFhLFNBQVMsa0JBQVQsRUFBakI7QUFDQSxNQUFJLFlBQVksU0FBUyxnQkFBVCxFQUFoQjtBQUNBLE1BQUksV0FBVyxTQUFTLFVBQVQsRUFBZjs7QUFFQSxNQUFJLGVBQWUsS0FBbkI7QUFDQSxNQUFJLG1CQUFtQixlQUFlLENBQXRDOztBQUVBO0FBQ0E7QUFDQSxNQUFJLFFBQVEsR0FBWjs7QUFFQSxhQUFXLElBQVgsR0FBa0IsU0FBbEI7QUFDQTtBQUNBLGFBQVcsU0FBWCxDQUFxQixLQUFyQixHQUE2QixJQUE3Qjs7QUFFQSxZQUFVLEtBQVYsR0FBa0Isd0JBQXdCLFdBQVcsS0FBWCxDQUF4QixFQUEyQyxZQUEzQyxDQUFsQjs7QUFFQSxNQUFJLFFBQVEsSUFBSSxZQUFKLENBQWlCLFlBQWpCLENBQVo7QUFDQSxPQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLElBQUksWUFBcEIsRUFBa0MsR0FBbEMsRUFBdUM7QUFDckMsVUFBTSxDQUFOLElBQVcsS0FBSyxHQUFMLENBQVMsSUFBSSxnQkFBYixJQUFpQyxnQkFBNUM7QUFDRDtBQUNELFlBQVUsS0FBVixHQUFrQixLQUFsQjtBQUNBLFlBQVUsT0FBVixDQUFrQixVQUFsQjs7QUFFQSxhQUFXLE9BQVgsQ0FBbUIsU0FBbkI7O0FBRUEsV0FBUyxJQUFULENBQWMsS0FBZCxHQUFzQixHQUF0QjtBQUNBLFlBQVUsT0FBVixDQUFrQixTQUFTLElBQTNCOztBQUVBO0FBQ0EsV0FBUyxPQUFULENBQWlCLE9BQWpCOztBQUVBLFlBQVUsT0FBVixDQUFrQixTQUFsQjtBQUNBLFlBQVUsT0FBVixDQUFrQixRQUFsQjs7QUFFQSxTQUFPLFNBQVA7QUFDRDs7QUFFRCxTQUFTLHVCQUFULENBQWlDLEtBQWpDLEVBQXdDLFlBQXhDLEVBQXNEO0FBQ3BEO0FBQ0E7O0FBRUEsTUFBSSxhQUFhLGVBQWUsQ0FBaEM7O0FBRUEsTUFBSSxRQUFRLElBQUksWUFBSixDQUFpQixZQUFqQixDQUFaO0FBQ0EsTUFBSSxjQUFjLFFBQVEsVUFBMUI7O0FBRUEsT0FBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLFVBQXBCLEVBQWdDLEdBQWhDLEVBQXFDO0FBQ25DLFFBQUksUUFBUyxJQUFJLFdBQUwsR0FBb0IsQ0FBcEIsR0FBd0IsQ0FBcEM7O0FBRUEsVUFBTSxhQUFhLENBQW5CLElBQXdCLENBQUMsS0FBekI7QUFDQSxVQUFNLGFBQWEsQ0FBbkIsSUFBd0IsS0FBeEI7QUFDRDtBQUNELFFBQU0sQ0FBTixJQUFXLE1BQU0sQ0FBTixDQUFYLENBZm9ELENBZS9COztBQUVyQixTQUFPLEtBQVA7QUFDRCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJjb25zdCBGSUxURVJfUEFSQU1TID0gWyd0eXBlJywgJ2ZyZXF1ZW5jeScsICdnYWluJywgJ2RldHVuZScsICdRJ107XG5jb25zdCBDT01QUkVTU09SX1BBUkFNUyA9IFsndGhyZXNob2xkJywgJ2tuZWUnLCAncmF0aW8nLCAnYXR0YWNrJywgJ3JlbGVhc2UnXTtcbmNvbnN0IERFRkFVTFRfT1BUSU9OUyA9IHtcbiAgdGhyZXNob2xkOiAtNTAsXG4gIGtuZWU6IDQwLFxuICByYXRpbzogMTIsXG4gIHJlZHVjdGlvbjogLTIwLFxuICBhdHRhY2s6IDAsXG4gIHJlbGVhc2U6IDAuMjUsXG4gIFE6IDguMzAsXG4gIGZyZXF1ZW5jeTogMzU1LFxuICBnYWluOiAzLjAsXG4gIHR5cGU6ICdiYW5kcGFzcycsXG59O1xuXG5jbGFzcyBOb2lzZUdhdGVOb2RlIHtcbiAgY29uc3RydWN0b3IoYXVkaW9DdHgsIG9wdGlvbnMgPSB7fSkge1xuICAgIG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCBERUZBVUxUX09QVElPTlMsIG9wdGlvbnMpO1xuXG4gICAgbGV0IGNvbXByZXNzb3JQcmFtYXMgPSB0aGlzLnNlbGVjdFBhcmFtcyhvcHRpb25zLCBDT01QUkVTU09SX1BBUkFNUyk7XG4gICAgbGV0IGZpbHRlclByYW1hcyA9IHRoaXMuc2VsZWN0UGFyYW1zKG9wdGlvbnMsIEZJTFRFUl9QQVJBTVMpO1xuXG4gICAgdGhpcy5jb21wcmVzc29yID0gbmV3IER5bmFtaWNzQ29tcHJlc3Nvck5vZGUoYXVkaW9DdHgsIGNvbXByZXNzb3JQcmFtYXMpO1xuICAgIHRoaXMuZmlsdGVyID0gbmV3IEJpcXVhZEZpbHRlck5vZGUoYXVkaW9DdHgsIGZpbHRlclByYW1hcyk7XG5cbiAgICB0aGlzLmNvbXByZXNzb3IuY29ubmVjdCh0aGlzLmZpbHRlcik7XG5cbiAgICByZXR1cm4gdGhpcy5maWx0ZXI7XG4gIH1cblxuICBzZWxlY3RQYXJhbXMob2JqZWN0LCBmaWx0ZXJBcnIpIHtcbiAgICByZXR1cm4gT2JqZWN0LmtleXMob2JqZWN0KS5yZWR1Y2UoZnVuY3Rpb24gKG9wdCwgcCkge1xuICAgICAgaWYgKGZpbHRlckFyci5pbmNsdWRlcyhwKSkge1xuICAgICAgICBvcHRbcF0gPSBvYmplY3RbcF07XG4gICAgICB9XG4gICAgICByZXR1cm4gb3B0O1xuICAgIH0sIHt9KTtcbiAgfVxuXG4gIHNldFBhcmFtcyhub2RlLCBhdWRpb1BhcmFtcykge1xuICAgIGZvciAobGV0IHBhcmFtIGluIGF1ZGlvUGFyYW1zKSB7XG4gICAgICBsZXQgdmFsdWUgPSBhdWRpb1BhcmFtc1twYXJhbV07XG4gICAgICBpZiAobm9kZVtwYXJhbV0gaW5zdGFuY2VvZiBBdWRpb1BhcmFtKSB7XG4gICAgICAgIG5vZGVbcGFyYW1dLnZhbHVlID0gdmFsdWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBub2RlW3BhcmFtXSA9IHZhbHVlO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5leHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBOb2lzZUdhdGVOb2RlOyIsImltcG9ydCBOb2lzZUdhdGVOb2RlIGZyb20gJ25vaXNlLWdhdGUnO1xuaW1wb3J0IEF1ZGlvVmlzdWFsaXplciBmcm9tICcuL2F1ZGlvLXZpc3VhbGl6ZXIuanMnO1xuXG53aW5kb3cuQXVkaW9Db250ZXh0ID0gd2luZG93LkF1ZGlvQ29udGV4dCB8fCB3aW5kb3cud2Via2l0QXVkaW9Db250ZXh0O1xuXG5jb25zdCBhdWRpb0N0eCA9IG5ldyBBdWRpb0NvbnRleHQoKTtcbmNvbnN0IFVSTHMgPSB7XG4gIGJsdWV5ZWxsb3c6ICdhdWRpb3MvYmx1ZXllbGxvdy53YXYnLFxuICB0ZWNobm86ICdhdWRpb3MvdGVjaG5vLndhdicsXG4gIG9yZ2FuOiAnYXVkaW9zL29yZ2FuLWVjaG8tY2hvcmRzLndhdicsXG59O1xuXG5mdW5jdGlvbiBsb2FkU291bmQodXJsKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgIHhoci5vcGVuKCdHRVQnLCB1cmwsIHRydWUpO1xuICAgIHhoci5yZXNwb25zZVR5cGUgPSAnYXJyYXlidWZmZXInO1xuICAgIHhoci5vbmxvYWQgPSByZXNvbHZlO1xuICAgIHhoci5vbmVycm9yID0gcmVqZWN0O1xuXG4gICAgeGhyLnNlbmQoKTtcbiAgfSlcbn1cblxuY2xhc3MgQXBwIHtcbiAgY29uc3RydWN0b3IoYXVkaW9DdHgpIHtcbiAgICB0aGlzLnN0cmVhbSA9IG51bGw7XG4gICAgdGhpcy5zb3VyY2UgPSBudWxsO1xuICAgIHRoaXMuY29udGV4dCA9IGF1ZGlvQ3R4O1xuICAgIHRoaXMuY2h1bmtzID0gW107XG4gICAgdGhpcy5hcHBseU5vaXNlR2F0ZSA9IHRydWU7XG5cbiAgICB0aGlzLnZpc3VhbGl6ZXIgPSBuZXcgQXVkaW9WaXN1YWxpemVyKCd2aXN1YWxpemVyJywge1xuICAgICAgdHlwZTogJ3dhdmUnLFxuICAgICAgd2lkdGg6IDcwMCwgaGVpZ2h0OiA1MDAsXG4gICAgICBzdHJva2VTdHlsZTogJ3JnYigyNTUsIDI1NSwgMjU1KSdcbiAgICB9KTtcblxuICAgIHRoaXMuZ2V0VXNlck1lZGlhKCk7XG5cbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVjb3JkLWJ1dHRvbicpLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIGV2ZW50ID0+IHtcbiAgICAgIGlmICghdGhpcy5zdHJlYW0gfHwgIXRoaXMuc3RyZWFtLmFjdGl2ZSkge1xuICAgICAgICBhbGVydCgnUmVxdWlyZSB0byBhY2Nlc3MgdG8geW91ciBtaWNyb3Bob25lLicpO1xuICAgICAgICBldmVudC50YXJnZXQuY2hlY2tlZCA9IGZhbHNlO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGlmICghdGhpcy5tZWRpYVJlY29yZGVyIHx8dGhpcy5tZWRpYVJlY29yZGVyLnN0cmVhbS5pZCAhPT0gdGhpcy5zdHJlYW0uaWQpIHtcbiAgICAgICAgdGhpcy5tZWRpYVJlY29yZGVyID0gbmV3IE1lZGlhUmVjb3JkZXIodGhpcy5zdHJlYW0pO1xuICAgICAgICB0aGlzLm1lZGlhUmVjb3JkZXIub25zdG9wID0gdGhpcy5vblN0b3AuYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5tZWRpYVJlY29yZGVyLm9uZGF0YWF2YWlsYWJsZSA9IHRoaXMub25EYXRhQXZhaWxhYmxlLmJpbmQodGhpcyk7XG4gICAgICB9XG5cbiAgICAgIGlmIChldmVudC50YXJnZXQuY2hlY2tlZCkge1xuICAgICAgICB0aGlzLm1lZGlhUmVjb3JkZXIuc3RhcnQoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMubWVkaWFSZWNvcmRlci5zdG9wKCk7XG4gICAgICB9XG4gICAgfSwgZmFsc2UpO1xuXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeU5hbWUoJ2FuYWx5c2VyLXR5cGUnKS5mb3JFYWNoKGlucHV0ID0+IHtcbiAgICAgIGlucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIGV2ZW50ID0+IHtcbiAgICAgICAgdGhpcy52aXN1YWxpemVyLnNldFR5cGUoZXZlbnQudGFyZ2V0LnZhbHVlKTtcbiAgICAgIH0pXG4gICAgfSk7XG5cbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW5wdXQtY2hlY2snKS5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBldmVudCA9PiB7XG4gICAgICBpZiAoZXZlbnQudGFyZ2V0LmNoZWNrZWQpIHtcbiAgICAgICAgdGhpcy5zdG9wQXVkaW9Tb3VyY2UoKTtcbiAgICAgICAgdGhpcy5nZXRVc2VyTWVkaWEoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuc3RvcFVzZXJNZWRpYSgpO1xuICAgICAgICB0aGlzLmxvYWRTb3VuZChVUkxzLm9yZ2FuKTtcbiAgICAgIH1cbiAgICB9LCBmYWxzZSk7XG5cbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbm9pc2UtZ2F0ZScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIGV2ZW50ID0+IHtcbiAgICAgIHRoaXMuYXBwbHlOb2lzZUdhdGUgPSAhIWV2ZW50LnRhcmdldC5jaGVja2VkO1xuICAgIH0sIGZhbHNlKTtcbiAgfVxuXG4gIG9uU3RvcCAoZSkge1xuICAgIGxldCBibG9iID0gbmV3IEJsb2IodGhpcy5jaHVua3MsIHsgJ3R5cGUnIDogJ2F1ZGlvL29nZzsgY29kZWNzPW9wdXMnIH0pO1xuICAgIGxldCBhdWRpb1VSTCA9IHdpbmRvdy5VUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xuICAgIHRoaXMuY2h1bmtzID0gW107XG5cbiAgICB0aGlzLmxvYWRTb3VuZChhdWRpb1VSTCwgKCkgPT4ge1xuICAgICAgdGhpcy5zdG9wQXVkaW9Tb3VyY2UoKTtcbiAgICAgIHRoaXMuZ2V0VXNlck1lZGlhKCk7XG4gICAgfSk7XG4gIH1cblxuICBvbkRhdGFBdmFpbGFibGUgKGUpIHtcbiAgICBjb25zb2xlLmxvZygnb25kYXRhYXZhaWxhYmxlJywgZS5kYXRhKTtcbiAgICB0aGlzLmNodW5rcy5wdXNoKGUuZGF0YSk7XG4gIH1cblxuICBsb2FkU291bmQodXJsLCBvbmVuZGVkKSB7XG4gICAgcmV0dXJuIGxvYWRTb3VuZCh1cmwpXG4gICAgLnRoZW4oKGV2ZW50KSA9PiB7XG4gICAgICBsZXQgeyByZXNwb25zZSB9ID0gZXZlbnQudGFyZ2V0O1xuXG4gICAgICB0aGlzLmNvbnRleHQuZGVjb2RlQXVkaW9EYXRhKHJlc3BvbnNlLCBidWZmZXIgPT4ge1xuICAgICAgICBsZXQgc291cmNlID0gbmV3IEF1ZGlvQnVmZmVyU291cmNlTm9kZSh0aGlzLmNvbnRleHQsIHsgYnVmZmVyIH0pO1xuICAgICAgICBsZXQgYW5hbHlzZXIgPSBuZXcgQW5hbHlzZXJOb2RlKHRoaXMuY29udGV4dCk7XG5cbiAgICAgICAgaWYgKHRoaXMuYXBwbHlOb2lzZUdhdGUpIHtcbiAgICAgICAgICBsZXQgbm9pc2VHYXRlID0gbmV3IE5vaXNlR2F0ZU5vZGUodGhpcy5jb250ZXh0KTtcblxuICAgICAgICAgIHNvdXJjZS5jb25uZWN0KG5vaXNlR2F0ZSk7XG4gICAgICAgICAgbm9pc2VHYXRlLmNvbm5lY3QoYW5hbHlzZXIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNvdXJjZS5jb25uZWN0KGFuYWx5c2VyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGFuYWx5c2VyLmNvbm5lY3QodGhpcy5jb250ZXh0LmRlc3RpbmF0aW9uKTtcbiAgICAgICAgc291cmNlLnN0YXJ0KCk7XG4gICAgICAgIHNvdXJjZS5vbmVuZGVkID0gb25lbmRlZDtcblxuICAgICAgICB0aGlzLnZpc3VhbGl6ZXIuY29ubmVjdChhbmFseXNlcik7XG4gICAgICAgIHRoaXMuc291cmNlID0gc291cmNlO1xuICAgICAgfSk7XG4gICAgfSlcbiAgICAuY2F0Y2goZSA9PiBjb25zb2xlLmxvZyhlKSk7XG4gIH1cblxuICBzdG9wQXVkaW9Tb3VyY2UoKSB7XG4gICAgaWYgKHRoaXMuc291cmNlKSB7XG4gICAgICB0aGlzLnNvdXJjZS5zdG9wKCk7XG4gICAgfVxuICB9XG5cbiAgc3RvcFVzZXJNZWRpYSgpIHtcbiAgICBpZiAodGhpcy5zdHJlYW0gJiYgdGhpcy5zdHJlYW0uYWN0aXZlKSB7XG4gICAgICBsZXQgdHJhY2tzID0gdGhpcy5zdHJlYW0uZ2V0VHJhY2tzKCk7XG4gICAgICB0cmFja3MuZm9yRWFjaCh0cmFjayA9PiB0cmFjay5zdG9wKCkpO1xuICAgIH1cbiAgfVxuXG4gIGdldFVzZXJNZWRpYSgpIHtcbiAgICB0aGlzLnN0b3BVc2VyTWVkaWEoKTtcbiAgICBuYXZpZ2F0b3IubWVkaWFEZXZpY2VzLmdldFVzZXJNZWRpYSh7IGF1ZGlvOiB0cnVlIH0pXG4gICAgLnRoZW4oKHN0cmVhbSkgPT4ge1xuICAgICAgdGhpcy5zdHJlYW0gPSBzdHJlYW07XG4gICAgICBsZXQgc291cmNlID0gdGhpcy5jb250ZXh0LmNyZWF0ZU1lZGlhU3RyZWFtU291cmNlKHN0cmVhbSk7XG4gICAgICBsZXQgYW5hbHlzZXIgPSBuZXcgQW5hbHlzZXJOb2RlKHRoaXMuY29udGV4dCk7XG5cbiAgICAgIGlmICh0aGlzLmFwcGx5Tm9pc2VHYXRlKSB7XG4gICAgICAgIGxldCBub2lzZUdhdGUgPSBuZXcgTm9pc2VHYXRlTm9kZSh0aGlzLmNvbnRleHQpO1xuICAgICAgICBzb3VyY2UuY29ubmVjdChub2lzZUdhdGUpO1xuICAgICAgICBub2lzZUdhdGUuY29ubmVjdChhbmFseXNlcik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzb3VyY2UuY29ubmVjdChhbmFseXNlcik7XG4gICAgICB9XG4gICAgICBhbmFseXNlci5jb25uZWN0KHRoaXMuY29udGV4dC5kZXN0aW5hdGlvbik7XG5cbiAgICAgIHRoaXMudmlzdWFsaXplci5jb25uZWN0KGFuYWx5c2VyKTtcblxuICAgICAgdGhpcy5zb3VyY2UgPSBzb3VyY2U7XG4gICAgfSlcbiAgICAuY2F0Y2goKGUpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKGUpO1xuICAgIH0pO1xuICB9XG59XG5cbm5ldyBBcHAoYXVkaW9DdHgpOyIsImNvbnN0IFdBVkUgPSAnd2F2ZSc7XG5jb25zdCBGUkVRVUVOQ1kgPSAnZnJlcXVlbmN5Jztcblxud2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgd2luZG93Lm1velJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCB3aW5kb3cud2Via2l0UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8IHdpbmRvdy5tc1JlcXVlc3RBbmltYXRpb25GcmFtZTtcbndpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSA9IHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSB8fCB3aW5kb3cubW96Q2FuY2VsQW5pbWF0aW9uRnJhbWU7XG5cbmNvbnN0IERFRkFVTFQgPSB7XG4gIGJhY2tncm91bmRDb2xvcjogJ3JnYigyNSwgMjUsIDI1KScsXG4gIGhlaWdodDogMzAwLFxuICBsaW5lV2lkdGg6IDIsXG4gIHN0cm9rZVN0eWxlOiAncmdiKDAsIDAsIDApJyxcbiAgdHlwZTogRlJFUVVFTkNZLFxuICB3aWR0aDogMzAwLFxufTtcblxuY2xhc3MgQXVkaW9WaXN1YWxpemVyIHtcbiAgY29uc3RydWN0b3IoY2FudmFzSWQsIG9wdGlvbnMgPSB7fSkge1xuICAgIHRoaXMuYW5pbWF0aW9uRnJhbWVJZCA9IG51bGw7XG4gICAgdGhpcy5kYXRhQXJyYXkgPSBudWxsO1xuXG4gICAgdGhpcy5vcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgREVGQVVMVCwgb3B0aW9ucyk7XG5cbiAgICBsZXQgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoY2FudmFzSWQpO1xuICAgIHRoaXMuY2FudmFzQ3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cbiAgICBjYW52YXMud2lkdGggPSB0aGlzLm9wdGlvbnMud2lkdGg7XG4gICAgY2FudmFzLmhlaWdodCA9IHRoaXMub3B0aW9ucy5oZWlnaHQ7XG4gIH1cblxuICBpbml0Qnl0ZUJ1ZmZlciAoZnJlcXVlbmN5QmluQ291bnQpIHtcbiAgICBpZiAoIXRoaXMuZGF0YUFycmF5IHx8IHRoaXMuZGF0YUFycmF5Lmxlbmd0aCAhPT0gZnJlcXVlbmN5QmluQ291bnQpIHtcbiAgICAgIHJldHVybiBuZXcgRmxvYXQzMkFycmF5KGZyZXF1ZW5jeUJpbkNvdW50KTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5kYXRhQXJyYXk7XG4gIH1cblxuICBjb25uZWN0IChhbmFseXNlcikge1xuICAgIHRoaXMudXBkYXRlQW5hbHlzZXIoYW5hbHlzZXIpO1xuICB9XG5cbiAgZGlzY29ubmVjdCAoKSB7XG4gICAgY2FuY2VsQW5pbWF0aW9uRnJhbWUodGhpcy5hbmltYXRpb25GcmFtZUlkKTtcbiAgfVxuXG4gIHVwZGF0ZUFuYWx5c2VyKGFuYWx5c2VyKSB7XG4gICAgdGhpcy5yZW5kZXIoYW5hbHlzZXIpO1xuXG4gICAgdGhpcy5hbmltYXRpb25GcmFtZUlkID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSh0aGlzLnVwZGF0ZUFuYWx5c2VyLmJpbmQodGhpcywgYW5hbHlzZXIpKTtcbiAgfVxuXG4gIHNldFR5cGUodHlwZSkge1xuICAgIHRoaXMub3B0aW9ucy50eXBlID0gdHlwZSA9PT0gRlJFUVVFTkNZID8gRlJFUVVFTkNZIDogV0FWRTtcbiAgfVxuXG4gIHJlbmRlciAoYW5hbHlzZXIpIHtcbiAgICB0aGlzLmRhdGFBcnJheSA9IHRoaXMuaW5pdEJ5dGVCdWZmZXIoYW5hbHlzZXIuZnJlcXVlbmN5QmluQ291bnQpO1xuXG4gICAgc3dpdGNoKHRoaXMub3B0aW9ucy50eXBlKSB7XG4gICAgICBjYXNlIFdBVkU6XG4gICAgICAgIGFuYWx5c2VyLmdldEZsb2F0VGltZURvbWFpbkRhdGEodGhpcy5kYXRhQXJyYXkpO1xuICAgICAgICB0aGlzLnJlbmRlcldhdmUodGhpcy5kYXRhQXJyYXksIHRoaXMuY2FudmFzQ3R4KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIEZSRVFVRU5DWTpcbiAgICAgICAgYW5hbHlzZXIuZ2V0RmxvYXRGcmVxdWVuY3lEYXRhKHRoaXMuZGF0YUFycmF5KTtcbiAgICAgICAgdGhpcy5yZW5kZXJGcmVxdWVuY3kodGhpcy5kYXRhQXJyYXksIHRoaXMuY2FudmFzQ3R4KTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgcmVuZGVyV2F2ZShkYXRhQXJyYXksIGNhbnZhc0N0eCkge1xuICAgIGxldCBidWZmZXJMZW5ndGggPSBkYXRhQXJyYXkubGVuZ3RoO1xuICAgIGxldCB4ID0gMDtcbiAgICBsZXQgeyB3aWR0aCwgaGVpZ2h0LCBzdHJva2VTdHlsZSwgbGluZVdpZHRoLCBiYWNrZ3JvdW5kQ29sb3IgfSA9IHRoaXMub3B0aW9ucztcblxuICAgIGNhbnZhc0N0eC5zdHJva2VTdHlsZSA9IHN0cm9rZVN0eWxlO1xuICAgIGNhbnZhc0N0eC5saW5lV2lkdGggPSBsaW5lV2lkdGg7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGJ1ZmZlckxlbmd0aDsgaSsrKSB7XG4gICAgICBsZXQgeSA9IGhlaWdodCAvIDIgKyBkYXRhQXJyYXlbaV0gKiAyMDA7XG5cbiAgICAgIGlmIChpID09PSAwKSB7XG4gICAgICAgIHggPSAwO1xuICAgICAgICBjYW52YXNDdHguY2xlYXJSZWN0KDAsIDAsIHdpZHRoLCBoZWlnaHQpO1xuICAgICAgICBjYW52YXNDdHguZmlsbFN0eWxlID0gYmFja2dyb3VuZENvbG9yO1xuICAgICAgICBjYW52YXNDdHguZmlsbFJlY3QoMCwgMCwgd2lkdGgsIGhlaWdodCk7XG4gICAgICAgIGNhbnZhc0N0eC5iZWdpblBhdGgoKTtcblxuICAgICAgICBjYW52YXNDdHgubW92ZVRvKHgsIHkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY2FudmFzQ3R4LmxpbmVUbyh4LCB5KTtcbiAgICAgIH1cblxuICAgICAgeCArPSB3aWR0aCAvIGJ1ZmZlckxlbmd0aDtcbiAgICB9XG5cbiAgICBjYW52YXNDdHguc3Ryb2tlKCk7XG4gIH1cblxuICByZW5kZXJGcmVxdWVuY3koZGF0YUFycmF5LCBjYW52YXNDdHgpIHtcbiAgICBsZXQgeyB3aWR0aCwgaGVpZ2h0LCBiYWNrZ3JvdW5kQ29sb3IgfSA9IHRoaXMub3B0aW9ucztcbiAgICBsZXQgYnVmZmVyTGVuZ3RoID0gZGF0YUFycmF5Lmxlbmd0aDtcblxuICAgIGxldCBiYXJIZWlnaHQ7XG4gICAgbGV0IGJhcldpZHRoID0gd2lkdGggLyBidWZmZXJMZW5ndGg7XG4gICAgbGV0IHggPSAwO1xuXG4gICAgY2FudmFzQ3R4LmZpbGxTdHlsZSA9IGJhY2tncm91bmRDb2xvcjtcbiAgICBjYW52YXNDdHguZmlsbFJlY3QoMCwgMCwgd2lkdGgsIGhlaWdodCk7XG5cbiAgICBmb3IobGV0IGkgPSAwOyBpIDwgYnVmZmVyTGVuZ3RoOyBpKyspIHtcbiAgICAgIGJhckhlaWdodCA9IC0gZGF0YUFycmF5W2ldICogMjtcblxuICAgICAgY2FudmFzQ3R4LmZpbGxTdHlsZSA9IGByZ2IoJHt+figyNTUgLSBNYXRoLnBvdygtYmFySGVpZ2h0IC8gMTUsIDIpKX0sIDUwLCA1MClgO1xuICAgICAgY2FudmFzQ3R4LmZpbGxSZWN0KHgsIGhlaWdodCwgYmFyV2lkdGgsIGJhckhlaWdodCAtIGhlaWdodCAvIDIpO1xuXG4gICAgICB4ICs9IGJhcldpZHRoICsgMTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gQXVkaW9WaXN1YWxpemVyOyIsImxldCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbmxldCBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbmxldCBtb3VudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyN2aXN1YWxpemVyLW1vdW50Jyk7XG5jYW52YXMud2lkdGggPSA1MDA7XG5jYW52YXMuaGVpZ2h0ID0gNTAwO1xuXG4vLyBmdW5jdGlvbiB0cmFuc2Zvcm1JbWFnZUFycmF5KGFycmF5KSB7XG4vLyAgIGxldCBidWZmZXJMZW5ndGggPSBhcnJheS5sZW5ndGg7XG4vLyAgIGZvciAobGV0IHBpeGVsID0gMDsgcGl4ZWwgPD0gYnVmZmVyTGVuZ3RoOyBwaXhlbCAtPSA0KSB7XG4vLyAgICAgbGV0IHIgPSBNYXRoLnJhbmRvbSgpO1xuLy8gICAgIGltZ0RhdGEuZGF0YVtwaXhlbF0gPSAxO1xuLy8gICAgIGltZ0RhdGEuZGF0YVtwaXhlbCArIDFdID0gMTtcbi8vICAgICBpbWdEYXRhLmRhdGFbcGl4ZWwgKyAyXSA9IDI1NSAqIE1hdGgucG93KHIsIGRpbW5lc3MpIHwgMDtcbi8vICAgICBpbWdEYXRhLmRhdGFbcGl4ZWwgKyAzXSA9IDI1NTtcbi8vICAgfVxuLy8gfVxuXG5jbGFzcyBJbWFnZUF1ZGlvbGl6ZXIge1xuICBjb25zdHJ1Y3RvcihhdWRpb0N0eCkge1xuICAgIHRoaXMuYXVkaW9DdHggPSBhdWRpb0N0eDtcbiAgICAvLyB0aGlzLmdldEltYWdlKGltYWdlU3JjLCB0aGlzLmltYWdlT25sYW5kKTtcbiAgfVxuXG4gIGdldEltYWdlRGF0YShpbWcpIHtcbiAgICBsZXQgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgbGV0IGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgIGxldCB7IHdpZHRoLCBoZWlnaHQgfSA9IGltZztcblxuICAgIGNhbnZhcy53aWR0aCA9IHdpZHRoIHx8IDUwMDtcbiAgICBjYW52YXMuaGVpZ2h0ID0gaGVpZ2h0IHx8IDUwMDtcbiAgICBjdHguZHJhd0ltYWdlKGltZywgMCwgMCk7XG5cbiAgICByZXR1cm4gY3R4LmdldEltYWdlRGF0YSgwLCAwLCB3aWR0aCwgaGVpZ2h0KVxuICB9XG5cbiAgZ2V0SW1hZ2UgKHVybCwgY2FsbGJhY2spIHtcbiAgICBsZXQgaW1nID0gbmV3IEltYWdlKCk7XG4gICAgaW1nLm9ubG9hZCA9IGNhbGxiYWNrLmJpbmQodGhpcywgaW1nKTtcbiAgICBpbWcuc3JjID0gdXJsO1xuXG4gICAgcmV0dXJuIGltZztcbiAgfVxuXG4gIHNjYWxlSW1hZ2VUb0F1ZGlvIChhcnIpIHtcbiAgICByZXR1cm4gYXJyLm1hcChwID0+ICgocCAvIDEyNy41KSAtIDEpKTtcbiAgfVxuXG4gIGZsb2F0MzJBcnJheVRvQXVkaW9CdWZmZXIgKGF1ZGlvQnVmZmVyLCBpbWdBcnJheSwgY2hhbm5lbE51bWJlciA9IDApIHtcbiAgICBsZXQgYXJyYXkgPSB0aGlzLnNjYWxlSW1hZ2VUb0F1ZGlvKGltZ0FycmF5KTtcbiAgICBhdWRpb0J1ZmZlci5jb3B5VG9DaGFubmVsKGFycmF5LCBjaGFubmVsTnVtYmVyKTtcblxuICAgIHJldHVybiBhdWRpb0J1ZmZlcjtcbiAgfVxuXG4gIHRvQXVkaW9CdWZmZXIoYXJyYXlzKSB7XG4gICAgbGV0IGF1ZGlvQnVmZmVyID0gdGhpcy5hdWRpb0N0eC5jcmVhdGVCdWZmZXIoYXJyYXlzLmxlbmd0aCwgYXJyYXlzWzBdLmxlbmd0aCwgdGhpcy5hdWRpb0N0eC5zYW1wbGVSYXRlKTtcblxuICAgIGZvcihsZXQgaSA9IDA7IGkgPCBhcnJheXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGF1ZGlvQnVmZmVyID0gdGhpcy5mbG9hdDMyQXJyYXlUb0F1ZGlvQnVmZmVyKGF1ZGlvQnVmZmVyLCBhcnJheXNbaV0sIGkpO1xuICAgIH1cblxuICAgIHJldHVybiBhdWRpb0J1ZmZlcjtcbiAgfVxuXG4gIHNlcGFyYXRlQ29sb3JMYXllcihpbWdBcnJheSkge1xuICAgIGxldCBhcnJheXMgPSBbXTtcblxuICAgIGFycmF5c1swXSA9IGltZ0FycmF5LmZpbHRlcigoXywgaSkgPT4gKGkrMSkgJSA0ID09IDEpO1xuICAgIGFycmF5c1sxXSA9IGltZ0FycmF5LmZpbHRlcigoXywgaSkgPT4gKGkrMSkgJSA0ID09IDIpO1xuICAgIGFycmF5c1syXSA9IGltZ0FycmF5LmZpbHRlcigoXywgaSkgPT4gKGkrMSkgJSA0ID09IDMpO1xuICAgIGFycmF5c1szXSA9IGltZ0FycmF5LmZpbHRlcigoXywgaSkgPT4gKGkrMSkgJSA0ID09IDApO1xuXG4gICAgcmV0dXJuIGFycmF5cztcbiAgfVxuXG4gIGltYWdlT25sYW5kIChpbWcpIHtcbiAgICBsZXQgaWRhdGEgPSB0aGlzLmdldEltYWdlRGF0YShpbWcpO1xuXG4gICAgbGV0IGltZ0Zsb2F0QXJyYXkgPSBuZXcgRmxvYXQzMkFycmF5KGlkYXRhLmRhdGEpO1xuICAgIGxldCBhcnJheXMgPSB0aGlzLnNlcGFyYXRlQ29sb3JMYXllcihpbWdGbG9hdEFycmF5KTtcblxuICAgIGxldCBhdWRpb0J1ZmZlciA9IHRoaXMudG9BdWRpb0J1ZmZlcihhcnJheXMpO1xuXG4gICAgYXVkaW9WaXN1YWxpemVyLnZpc3VhbGl6ZShhdWRpb0J1ZmZlcik7XG4gIH1cbn1cblxuY29uc3QgaWEgPSBuZXcgSW1hZ2VBdWRpb2xpemVyKG5ldyBBdWRpb0NvbnRleHQoKSk7XG4vLyBpYS5nZXRJbWFnZSgnLi9pbWFnZXMvc2VyZW5hLnBuZycsIGlhLmltYWdlT25sYW5kKTsiLCIoZnVuY3Rpb24oKSB7XG4gIHZhciBwcm9taXNpZmllZE9sZEdVTSA9IGZ1bmN0aW9uKGNvbnN0cmFpbnRzLCBzdWNjZXNzQ2FsbGJhY2ssIGVycm9yQ2FsbGJhY2spIHtcblxuICAgIHZhciBnZXRVc2VyTWVkaWEgPSAobmF2aWdhdG9yLmdldFVzZXJNZWRpYSB8fFxuICAgICAgbmF2aWdhdG9yLndlYmtpdEdldFVzZXJNZWRpYSB8fFxuICAgICAgbmF2aWdhdG9yLm1vekdldFVzZXJNZWRpYSB8fFxuICAgICAgbmF2aWdhdG9yLm1zR2V0VXNlck1lZGlhKTtcblxuICAgIGlmKCFnZXRVc2VyTWVkaWEpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ2dldFVzZXJNZWRpYSBpcyBub3QgaW1wbGVtZW50ZWQgaW4gdGhpcyBicm93c2VyJykpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihzdWNjZXNzQ2FsbGJhY2ssIGVycm9yQ2FsbGJhY2spIHtcbiAgICAgIGdldFVzZXJNZWRpYS5jYWxsKG5hdmlnYXRvciwgY29uc3RyYWludHMsIHN1Y2Nlc3NDYWxsYmFjaywgZXJyb3JDYWxsYmFjayk7XG4gICAgfSk7XG4gIH1cblxuICBpZihuYXZpZ2F0b3IubWVkaWFEZXZpY2VzID09PSB1bmRlZmluZWQpIHtcbiAgICBuYXZpZ2F0b3IubWVkaWFEZXZpY2VzID0ge307XG4gIH1cblxuICBpZihuYXZpZ2F0b3IubWVkaWFEZXZpY2VzLmdldFVzZXJNZWRpYSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgbmF2aWdhdG9yLm1lZGlhRGV2aWNlcy5nZXRVc2VyTWVkaWEgPSBwcm9taXNpZmllZE9sZEdVTTtcbiAgfVxufSkoKTsiLCJjb25zdCBGSUxURVJfUEFSQU1TID0gWyd0eXBlJywgJ2ZyZXF1ZW5jeScsICdnYWluJywgJ2RldHVuZScsICdRJ107XG5jb25zdCBDT01QUkVTU09SX1BBUkFNUyA9IFsndGhyZXNob2xkJywgJ2tuZWUnLCAncmF0aW8nLCAnYXR0YWNrJywgJ3JlbGVhc2UnXTtcbmNvbnN0IERFRkFVTFRfT1BUSU9OUyA9IHtcbiAgdGhyZXNob2xkOiAtNTAsXG4gIGtuZWU6IDQwLFxuICByYXRpbzogMTIsXG4gIHJlZHVjdGlvbjogLTIwLFxuICBhdHRhY2s6IDAsXG4gIHJlbGVhc2U6IDAuMjUsXG4gIFE6IDguMzAsXG4gIGZyZXF1ZW5jeTogMzU1LFxuICBnYWluOiAzLjAsXG4gIHR5cGU6ICdiYW5kcGFzcycsXG59O1xuXG5jbGFzcyBOb2lzZUdhdGVOb2RlIHtcbiAgY29uc3RydWN0b3IoYXVkaW9DdHgsIG9wdGlvbnMgPSB7fSkge1xuICAgIG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCBERUZBVUxUX09QVElPTlMsIG9wdGlvbnMpO1xuXG4gICAgbGV0IGNvbXByZXNzb3JQcmFtYXMgPSB0aGlzLnNlbGVjdFBhcmFtcyhvcHRpb25zLCBDT01QUkVTU09SX1BBUkFNUyk7XG4gICAgbGV0IGZpbHRlclByYW1hcyA9IHRoaXMuc2VsZWN0UGFyYW1zKG9wdGlvbnMsIEZJTFRFUl9QQVJBTVMpO1xuXG4gICAgdGhpcy5jb21wcmVzc29yID0gbmV3IER5bmFtaWNzQ29tcHJlc3Nvck5vZGUoYXVkaW9DdHgsIGNvbXByZXNzb3JQcmFtYXMpO1xuICAgIHRoaXMuZmlsdGVyID0gbmV3IEJpcXVhZEZpbHRlck5vZGUoYXVkaW9DdHgsIGZpbHRlclByYW1hcyk7XG5cbiAgICB0aGlzLmNvbXByZXNzb3IuY29ubmVjdCh0aGlzLmZpbHRlcik7XG5cbiAgICByZXR1cm4gdGhpcy5maWx0ZXI7XG4gIH1cblxuICBzZWxlY3RQYXJhbXMob2JqZWN0LCBmaWx0ZXJBcnIpIHtcbiAgICByZXR1cm4gT2JqZWN0LmtleXMob2JqZWN0KS5yZWR1Y2UoZnVuY3Rpb24gKG9wdCwgcCkge1xuICAgICAgaWYgKGZpbHRlckFyci5pbmNsdWRlcyhwKSkge1xuICAgICAgICBvcHRbcF0gPSBvYmplY3RbcF07XG4gICAgICB9XG4gICAgICByZXR1cm4gb3B0O1xuICAgIH0sIHt9KTtcbiAgfVxuXG4gIHNldFBhcmFtcyhub2RlLCBhdWRpb1BhcmFtcykge1xuICAgIGZvciAobGV0IHBhcmFtIGluIGF1ZGlvUGFyYW1zKSB7XG4gICAgICBsZXQgdmFsdWUgPSBhdWRpb1BhcmFtc1twYXJhbV07XG4gICAgICBpZiAobm9kZVtwYXJhbV0gaW5zdGFuY2VvZiBBdWRpb1BhcmFtKSB7XG4gICAgICAgIG5vZGVbcGFyYW1dLnZhbHVlID0gdmFsdWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBub2RlW3BhcmFtXSA9IHZhbHVlO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuIiwiZnVuY3Rpb24gY3Jvc3NmYWRlKHZhbHVlKSB7XG4gIC8vIGVxdWFsLXBvd2VyIGNyb3NzZmFkZVxuICB2YXIgZ2FpbjEgPSBNYXRoLmNvcyh2YWx1ZSAqIDAuNSAqIE1hdGguUEkpO1xuICB2YXIgZ2FpbjIgPSBNYXRoLmNvcygoMS4wIC0gdmFsdWUpICogMC41ICogTWF0aC5QSSk7XG5cbiAgZHJ5R2Fpbi5nYWluLnZhbHVlID0gZ2FpbjE7XG4gIHdldEdhaW4uZ2Fpbi52YWx1ZSA9IGdhaW4yO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0VG9Nb25vKGlucHV0KSB7XG4gIGxldCBzcGxpdHRlciA9IGF1ZGlvQ3R4LmNyZWF0ZUNoYW5uZWxTcGxpdHRlcigyKTtcbiAgbGV0IG1lcmdlciA9IGF1ZGlvQ3R4LmNyZWF0ZUNoYW5uZWxNZXJnZXIoMik7XG5cbiAgaW5wdXQuY29ubmVjdChzcGxpdHRlcik7XG4gIHNwbGl0dGVyLmNvbm5lY3QobWVyZ2VyLCAwLCAwKTtcbiAgc3BsaXR0ZXIuY29ubmVjdChtZXJnZXIsIDAsIDEpO1xuXG4gIHJldHVybiBtZXJnZXI7XG59XG5cbmZ1bmN0aW9uIGluaXRTdHJlYW0gKG1lZGlhU3RyZWFtU291cmNlKSB7XG4gIGxldCBjb21wcmVzc29yID0gYXVkaW9DdHguY3JlYXRlRHluYW1pY3NDb21wcmVzc29yKCk7XG4gIGNvbXByZXNzb3IudGhyZXNob2xkLnZhbHVlID0gLTUwO1xuICBjb21wcmVzc29yLmtuZWUudmFsdWUgPSA0MDtcbiAgY29tcHJlc3Nvci5yYXRpby52YWx1ZSA9IDEyO1xuICBjb21wcmVzc29yLnJlZHVjdGlvbi52YWx1ZSA9IC0yMDtcbiAgY29tcHJlc3Nvci5hdHRhY2sudmFsdWUgPSAwO1xuICBjb21wcmVzc29yLnJlbGVhc2UudmFsdWUgPSAwLjI1O1xuXG4gIGxldCBmaWx0ZXIgPSBhdWRpb0N0eC5jcmVhdGVCaXF1YWRGaWx0ZXIoKTtcbiAgZmlsdGVyLlEudmFsdWUgPSA4LjMwO1xuICBmaWx0ZXIuZnJlcXVlbmN5LnZhbHVlID0gMzU1O1xuICBmaWx0ZXIuZ2Fpbi52YWx1ZSA9IDMuMDtcbiAgZmlsdGVyLnR5cGUgPSAnYmFuZHBhc3MnO1xuICBmaWx0ZXIuY29ubmVjdChjb21wcmVzc29yKTtcblxuICAvLyBjb21wcmVzc29yLmNvbm5lY3QoYXVkaW9DdHguZGVzdGluYXRpb24pO1xuICAvLyBmaWx0ZXIuY29ubmVjdChhdWRpb0N0eC5kZXN0aW5hdGlvbik7XG5cbiAgLy8gbGV0IG1lZGlhU3RyZWFtU291cmNlID0gYXVkaW9DdHguY3JlYXRlTWVkaWFTdHJlYW1Tb3VyY2Uoc3RyZWFtKTtcbiAgLy8gbWVkaWFTdHJlYW1Tb3VyY2UuY29ubmVjdChjb21wcmVzc29yKTtcbiAgbWVkaWFTdHJlYW1Tb3VyY2UuY29ubmVjdChmaWx0ZXIpO1xuXG4gIHJldHVybiBmaWx0ZXI7XG59XG5cbmZ1bmN0aW9uIGdvdFN0cmVhbShzdHJlYW0pIHtcbiAgdmFyIGlucHV0ID0gYXVkaW9DdHguY3JlYXRlTWVkaWFTdHJlYW1Tb3VyY2Uoc3RyZWFtKTtcbiAgbGV0IGF1ZGlvSW5wdXQgPSBjb252ZXJ0VG9Nb25vKGlucHV0KTtcblxuICAvLyBpZiAodXNlRmVlZGJhY2tSZWR1Y3Rpb24pIHtcbiAgLy8gICBhdWRpb0lucHV0LmNvbm5lY3QoY3JlYXRlTFBJbnB1dEZpbHRlcigpKTtcbiAgLy8gICBhdWRpb0lucHV0ID0gbHBJbnB1dEZpbHRlcjtcbiAgLy8gfVxuICAvLyBjcmVhdGUgbWl4IGdhaW4gbm9kZXNcbiAgb3V0cHV0TWl4ID0gYXVkaW9DdHguY3JlYXRlR2FpbigpO1xuICBkcnlHYWluID0gYXVkaW9DdHguY3JlYXRlR2FpbigpO1xuICB3ZXRHYWluID0gYXVkaW9DdHguY3JlYXRlR2FpbigpO1xuICAvLyBlZmZlY3RJbnB1dCA9IGF1ZGlvQ3R4LmNyZWF0ZUdhaW4oKTtcbiAgYXVkaW9JbnB1dC5jb25uZWN0KGRyeUdhaW4pO1xuICAvLyBhdWRpb0lucHV0LmNvbm5lY3QoYW5hbHlzZXIxKTtcbiAgLy8gYXVkaW9JbnB1dC5jb25uZWN0KGVmZmVjdElucHV0KTtcbiAgZHJ5R2Fpbi5jb25uZWN0KG91dHB1dE1peCk7XG4gIHdldEdhaW4uY29ubmVjdChvdXRwdXRNaXgpO1xuICBvdXRwdXRNaXguY29ubmVjdChhdWRpb0N0eC5kZXN0aW5hdGlvbik7XG4gIC8vIG91dHB1dE1peC5jb25uZWN0KGFuYWx5c2VyMik7XG4gIGNyb3NzZmFkZSgxLjApO1xuICAvLyBjaGFuZ2VFZmZlY3QoKTtcblxuICBsZXQgY3VycmVudEVmZmVjdE5vZGUgPSBjcmVhdGVOb2lzZUdhdGUoKTtcblxuICBhdWRpb0lucHV0LmNvbm5lY3QoY3VycmVudEVmZmVjdE5vZGUpO1xuXG4gIHJldHVybiBhdWRpb0lucHV0O1xufVxuXG5mdW5jdGlvbiBjcmVhdGVOb2lzZUdhdGUoKSB7XG4gIHZhciBpbnB1dE5vZGUgPSBhdWRpb0N0eC5jcmVhdGVHYWluKCk7XG4gIHZhciByZWN0aWZpZXIgPSBhdWRpb0N0eC5jcmVhdGVXYXZlU2hhcGVyKCk7XG4gIGxldCBuZ0ZvbGxvd2VyID0gYXVkaW9DdHguY3JlYXRlQmlxdWFkRmlsdGVyKCk7XG4gIGxldCBub2lzZUdhdGUgPSBhdWRpb0N0eC5jcmVhdGVXYXZlU2hhcGVyKCk7XG4gIGxldCBnYXRlR2FpbiA9IGF1ZGlvQ3R4LmNyZWF0ZUdhaW4oKTtcblxuICBsZXQgYnVmZmVyTGVuZ3RoID0gNjU1MzY7XG4gIGxldCBoYWxmQnVmZmVyTGVuZ3RoID0gYnVmZmVyTGVuZ3RoIC8gMjtcblxuICAvLyBtaW4gMCwgbWF4IDAuMSwgc3RlcCAwLjAwMSwgdmFsdWUgMC4wMVxuICAvLyBsZXQgZmxvb3IgPSAwLjAxMjtcbiAgbGV0IGZsb29yID0gMC4xO1xuXG4gIG5nRm9sbG93ZXIudHlwZSA9IFwibG93cGFzc1wiO1xuICAvLyBtaW4gMC4yNSwgbWF4IDIwLCBzdGVwIDAuMjUsIHZhbHVlIDEwXG4gIG5nRm9sbG93ZXIuZnJlcXVlbmN5LnZhbHVlID0gMTMuMDtcblxuICBub2lzZUdhdGUuY3VydmUgPSBnZW5lcmF0ZU5vaXNlRmxvb3JDdXJ2ZShwYXJzZUZsb2F0KGZsb29yKSwgYnVmZmVyTGVuZ3RoKTtcblxuICBsZXQgY3VydmUgPSBuZXcgRmxvYXQzMkFycmF5KGJ1ZmZlckxlbmd0aCk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYnVmZmVyTGVuZ3RoOyBpKyspIHtcbiAgICBjdXJ2ZVtpXSA9IE1hdGguYWJzKGkgLSBoYWxmQnVmZmVyTGVuZ3RoKSAvIGhhbGZCdWZmZXJMZW5ndGg7XG4gIH1cbiAgcmVjdGlmaWVyLmN1cnZlID0gY3VydmU7XG4gIHJlY3RpZmllci5jb25uZWN0KG5nRm9sbG93ZXIpO1xuXG4gIG5nRm9sbG93ZXIuY29ubmVjdChub2lzZUdhdGUpO1xuXG4gIGdhdGVHYWluLmdhaW4udmFsdWUgPSAwLjA7XG4gIG5vaXNlR2F0ZS5jb25uZWN0KGdhdGVHYWluLmdhaW4pO1xuXG4gIC8vIG1pc3Npbmcgd2V0R2FpblxuICBnYXRlR2Fpbi5jb25uZWN0KHdldEdhaW4pO1xuXG4gIGlucHV0Tm9kZS5jb25uZWN0KHJlY3RpZmllcik7XG4gIGlucHV0Tm9kZS5jb25uZWN0KGdhdGVHYWluKTtcblxuICByZXR1cm4gaW5wdXROb2RlO1xufVxuXG5mdW5jdGlvbiBnZW5lcmF0ZU5vaXNlRmxvb3JDdXJ2ZShmbG9vciwgYnVmZmVyTGVuZ3RoKSB7XG4gIC8vIFwiZmxvb3JcIiBpcyAwLi4uMVxuICAvLyBtaW4gMCwgbWF4IDAuMSwgc3RlcCAwLjAwMSwgdmFsdWUgMC4wMVxuXG4gIGxldCBoYWxmTGVuZ3RoID0gYnVmZmVyTGVuZ3RoIC8gMjtcblxuICBsZXQgY3VydmUgPSBuZXcgRmxvYXQzMkFycmF5KGJ1ZmZlckxlbmd0aCk7XG4gIGxldCBtYXBwZWRGbG9vciA9IGZsb29yICogaGFsZkxlbmd0aDtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGhhbGZMZW5ndGg7IGkrKykge1xuICAgIGxldCB2YWx1ZSA9IChpIDwgbWFwcGVkRmxvb3IpID8gMCA6IDE7XG5cbiAgICBjdXJ2ZVtoYWxmTGVuZ3RoIC0gaV0gPSAtdmFsdWU7XG4gICAgY3VydmVbaGFsZkxlbmd0aCArIGldID0gdmFsdWU7XG4gIH1cbiAgY3VydmVbMF0gPSBjdXJ2ZVsxXTsgLy8gZml4aW5nIHVwIHRoZSBlbmQuXG5cbiAgcmV0dXJuIGN1cnZlO1xufVxuIl19
