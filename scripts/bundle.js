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

var _wav = require('./wav.js');

var _wav2 = _interopRequireDefault(_wav);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

window.AudioContext = window.AudioContext || window.webkitAudioContext;

var audioCtx = new AudioContext();

// const wav = new Wav(audioCtx);

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

        var wav = (0, _wav2.default)(source);

        if (_this4.applyNoiseGate) {
          var noiseGate = new _noiseGate2.default(_this4.context);
          // source.connect(noiseGate);
          // noiseGate.connect(analyser);
          wav.connect(noiseGate).connect(analyser);
        } else {
          source.connect(analyser);
        }
        wav.output();
        // analyser.connect(this.context.destination);

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

},{"./audio-visualizer.js":3,"./wav.js":6,"noise-gate":1}],3:[function(require,module,exports){
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
"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function Wav(source) {
  return new Wav.fn.init(source);
}

Wav.fn = Wav.prototype = {
  constructor: Wav,
  length: 0,

  connect: function connect(node) {
    var lastNode = this.last();
    if (lastNode) {
      lastNode.connect(node);
    }
    this.push(node);

    return this;
  },

  disconnect: function disconnect(node) {
    var args = [].slice.call(arguments, 1);
    var index = this.indexOf(node);

    if (index !== -1) {
      node.disconnect.apply(node, args);
      this.splice(index, 1);
    }

    return this;
  },

  output: function output() {
    var lastNode = this.last();
    if (lastNode) {
      lastNode.connect(this.context.destination);
    } else {
      console.error('No AudioNode connect to output.');
    }

    return this;
  },

  setParams: function setParams(node, audioParams) {
    for (var param in audioParams) {
      var value = audioParams[param];
      if (node[param] instanceof AudioParam) {
        node[param].value = value;
      } else {
        node[param] = value;
      }
    }
  },

  last: function last() {
    return this.get(-1);
  },

  get: function get(num) {
    if (num == null) {
      return slice.call(this);
    }

    return num < 0 ? this[num + this.length] : this[num];
  },

  eq: function eq(i) {
    var len = this.length,
        j = +i + (i < 0 ? len : 0);
    return this.pushStack(j >= 0 && j < len ? [this[j]] : []);
  },

  pushStack: function pushStack(elems) {
    var ret = Wav.merge(this.constructor(), elems);
    ret.prevObject = this;

    return ret;
  },

  each: function each(callback) {
    return Wav.each(this, callback);
  },

  map: function map(callback) {
    return this.pushStack(Wav.map(this, function (elem, i) {
      return callback.call(elem, i, elem);
    }));
  },

  push: function push() {
    var _this = this;

    [].slice.call(arguments).forEach(function (arg) {
      _this[_this.length] = arg;
      _this.length++;
    });

    return this;
  },
  splice: function splice() {
    return Array.prototype.splice;
  },
  indexOf: function indexOf() {
    return Array.prototype.indexOf;
  }
};

Wav.extend = Wav.fn.extend = function () {
  var options,
      name,
      src,
      copy,
      copyIsArray,
      clone,
      target = arguments[0] || {},
      i = 1,
      length = arguments.length,
      deep = false;

  // Handle a deep copy situation
  if (typeof target === "boolean") {
    deep = target;

    // Skip the boolean and the target
    target = arguments[i] || {};
    i++;
  }

  // Handle case when target is a string or something (possible in deep copy)
  if ((typeof target === "undefined" ? "undefined" : _typeof(target)) !== "object" && !Wav.isFunction(target)) {
    target = {};
  }

  // Extend Wav itself if only one argument is passed
  if (i === length) {
    target = this;
    i--;
  }

  for (; i < length; i++) {

    // Only deal with non-null/undefined values
    if ((options = arguments[i]) != null) {

      // Extend the base object
      for (name in options) {
        src = target[name];
        copy = options[name];

        // Prevent never-ending loop
        if (target === copy) {
          continue;
        }

        // Recurse if we're merging plain objects or arrays
        if (deep && copy && (Wav.isPlainObject(copy) || (copyIsArray = Array.isArray(copy)))) {

          if (copyIsArray) {
            copyIsArray = false;
            clone = src && Array.isArray(src) ? src : [];
          } else {
            clone = src && Wav.isPlainObject(src) ? src : {};
          }

          // Never move original objects, clone them
          target[name] = Wav.extend(deep, clone, copy);

          // Don't bring in undefined values
        } else if (copy !== undefined) {
          target[name] = copy;
        }
      }
    }
  }

  // Return the modified object
  return target;
};

Wav.extend({
  merge: function merge(first, second) {
    var len = +second.length,
        j = 0,
        i = first.length;

    for (; j < len; j++) {
      first[i++] = second[j];
    }

    first.length = i;

    return first;
  }
});

var init = Wav.fn.init = function (source) {
  if (!source) {
    return this;
  }

  this.context = source.context;
  this.source = source;
  this[0] = source;

  this.length = 1;

  return this;
};

init.prototype = Wav.fn;

window.Wav = Wav;

exports = module.exports = Wav;

},{}]},{},[2,3,4,5])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIm5vZGVfbW9kdWxlcy9ub2lzZS1nYXRlL2luZGV4LmpzIiwic2NyaXB0cy5iYWJlbC9hcHAuanMiLCJzY3JpcHRzLmJhYmVsL2F1ZGlvLXZpc3VhbGl6ZXIuanMiLCJzY3JpcHRzLmJhYmVsL2ltYWdlLWF1ZGlvbGl6ZXIuanMiLCJzY3JpcHRzLmJhYmVsL21lZGlhRGV2aWNlcy1nZXRVc2VyTWVkaWEtcG9seWZpbGwuanMiLCJzY3JpcHRzLmJhYmVsL3dhdi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7OztBQ0FBLElBQU0sZ0JBQWdCLENBQUMsTUFBRCxFQUFTLFdBQVQsRUFBc0IsTUFBdEIsRUFBOEIsUUFBOUIsRUFBd0MsR0FBeEMsQ0FBdEI7QUFDQSxJQUFNLG9CQUFvQixDQUFDLFdBQUQsRUFBYyxNQUFkLEVBQXNCLE9BQXRCLEVBQStCLFFBQS9CLEVBQXlDLFNBQXpDLENBQTFCO0FBQ0EsSUFBTSxrQkFBa0I7QUFDdEIsYUFBVyxDQUFDLEVBRFU7QUFFdEIsUUFBTSxFQUZnQjtBQUd0QixTQUFPLEVBSGU7QUFJdEIsYUFBVyxDQUFDLEVBSlU7QUFLdEIsVUFBUSxDQUxjO0FBTXRCLFdBQVMsSUFOYTtBQU90QixLQUFHLElBUG1CO0FBUXRCLGFBQVcsR0FSVztBQVN0QixRQUFNLEdBVGdCO0FBVXRCLFFBQU07QUFWZ0IsQ0FBeEI7O0lBYU0sYTtBQUNKLHlCQUFZLFFBQVosRUFBb0M7QUFBQSxRQUFkLE9BQWMsdUVBQUosRUFBSTs7QUFBQTs7QUFDbEMsY0FBVSxPQUFPLE1BQVAsQ0FBYyxFQUFkLEVBQWtCLGVBQWxCLEVBQW1DLE9BQW5DLENBQVY7O0FBRUEsUUFBSSxtQkFBbUIsS0FBSyxZQUFMLENBQWtCLE9BQWxCLEVBQTJCLGlCQUEzQixDQUF2QjtBQUNB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Yjs7QUFFQSxVQUFVLE9BQU8sT0FBUCxHQUFpQixHQUEzQiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJjb25zdCBGSUxURVJfUEFSQU1TID0gWyd0eXBlJywgJ2ZyZXF1ZW5jeScsICdnYWluJywgJ2RldHVuZScsICdRJ107XG5jb25zdCBDT01QUkVTU09SX1BBUkFNUyA9IFsndGhyZXNob2xkJywgJ2tuZWUnLCAncmF0aW8nLCAnYXR0YWNrJywgJ3JlbGVhc2UnXTtcbmNvbnN0IERFRkFVTFRfT1BUSU9OUyA9IHtcbiAgdGhyZXNob2xkOiAtNTAsXG4gIGtuZWU6IDQwLFxuICByYXRpbzogMTIsXG4gIHJlZHVjdGlvbjogLTIwLFxuICBhdHRhY2s6IDAsXG4gIHJlbGVhc2U6IDAuMjUsXG4gIFE6IDguMzAsXG4gIGZyZXF1ZW5jeTogMzU1LFxuICBnYWluOiAzLjAsXG4gIHR5cGU6ICdiYW5kcGFzcycsXG59O1xuXG5jbGFzcyBOb2lzZUdhdGVOb2RlIHtcbiAgY29uc3RydWN0b3IoYXVkaW9DdHgsIG9wdGlvbnMgPSB7fSkge1xuICAgIG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCBERUZBVUxUX09QVElPTlMsIG9wdGlvbnMpO1xuXG4gICAgbGV0IGNvbXByZXNzb3JQcmFtYXMgPSB0aGlzLnNlbGVjdFBhcmFtcyhvcHRpb25zLCBDT01QUkVTU09SX1BBUkFNUyk7XG4gICAgbGV0IGZpbHRlclByYW1hcyA9IHRoaXMuc2VsZWN0UGFyYW1zKG9wdGlvbnMsIEZJTFRFUl9QQVJBTVMpO1xuXG4gICAgdGhpcy5jb21wcmVzc29yID0gbmV3IER5bmFtaWNzQ29tcHJlc3Nvck5vZGUoYXVkaW9DdHgsIGNvbXByZXNzb3JQcmFtYXMpO1xuICAgIHRoaXMuZmlsdGVyID0gbmV3IEJpcXVhZEZpbHRlck5vZGUoYXVkaW9DdHgsIGZpbHRlclByYW1hcyk7XG5cbiAgICB0aGlzLmNvbXByZXNzb3IuY29ubmVjdCh0aGlzLmZpbHRlcik7XG5cbiAgICByZXR1cm4gdGhpcy5maWx0ZXI7XG4gIH1cblxuICBzZWxlY3RQYXJhbXMob2JqZWN0LCBmaWx0ZXJBcnIpIHtcbiAgICByZXR1cm4gT2JqZWN0LmtleXMob2JqZWN0KS5yZWR1Y2UoZnVuY3Rpb24gKG9wdCwgcCkge1xuICAgICAgaWYgKGZpbHRlckFyci5pbmNsdWRlcyhwKSkge1xuICAgICAgICBvcHRbcF0gPSBvYmplY3RbcF07XG4gICAgICB9XG4gICAgICByZXR1cm4gb3B0O1xuICAgIH0sIHt9KTtcbiAgfVxuXG4gIHNldFBhcmFtcyhub2RlLCBhdWRpb1BhcmFtcykge1xuICAgIGZvciAobGV0IHBhcmFtIGluIGF1ZGlvUGFyYW1zKSB7XG4gICAgICBsZXQgdmFsdWUgPSBhdWRpb1BhcmFtc1twYXJhbV07XG4gICAgICBpZiAobm9kZVtwYXJhbV0gaW5zdGFuY2VvZiBBdWRpb1BhcmFtKSB7XG4gICAgICAgIG5vZGVbcGFyYW1dLnZhbHVlID0gdmFsdWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBub2RlW3BhcmFtXSA9IHZhbHVlO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5leHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBOb2lzZUdhdGVOb2RlOyIsImltcG9ydCBOb2lzZUdhdGVOb2RlIGZyb20gJ25vaXNlLWdhdGUnO1xuaW1wb3J0IEF1ZGlvVmlzdWFsaXplciBmcm9tICcuL2F1ZGlvLXZpc3VhbGl6ZXIuanMnO1xuaW1wb3J0IFdhdiBmcm9tICcuL3dhdi5qcyc7XG5cbndpbmRvdy5BdWRpb0NvbnRleHQgPSB3aW5kb3cuQXVkaW9Db250ZXh0IHx8IHdpbmRvdy53ZWJraXRBdWRpb0NvbnRleHQ7XG5cbmNvbnN0IGF1ZGlvQ3R4ID0gbmV3IEF1ZGlvQ29udGV4dCgpO1xuXG4vLyBjb25zdCB3YXYgPSBuZXcgV2F2KGF1ZGlvQ3R4KTtcblxuY29uc3QgVVJMcyA9IHtcbiAgYmx1ZXllbGxvdzogJ2F1ZGlvcy9ibHVleWVsbG93LndhdicsXG4gIHRlY2hubzogJ2F1ZGlvcy90ZWNobm8ud2F2JyxcbiAgb3JnYW46ICdhdWRpb3Mvb3JnYW4tZWNoby1jaG9yZHMud2F2Jyxcbn07XG5cbmZ1bmN0aW9uIGxvYWRTb3VuZCh1cmwpIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICB2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgeGhyLm9wZW4oJ0dFVCcsIHVybCwgdHJ1ZSk7XG4gICAgeGhyLnJlc3BvbnNlVHlwZSA9ICdhcnJheWJ1ZmZlcic7XG4gICAgeGhyLm9ubG9hZCA9IHJlc29sdmU7XG4gICAgeGhyLm9uZXJyb3IgPSByZWplY3Q7XG5cbiAgICB4aHIuc2VuZCgpO1xuICB9KVxufVxuXG5jbGFzcyBBcHAge1xuICBjb25zdHJ1Y3RvcihhdWRpb0N0eCkge1xuICAgIHRoaXMuc3RyZWFtID0gbnVsbDtcbiAgICB0aGlzLnNvdXJjZSA9IG51bGw7XG4gICAgdGhpcy5jb250ZXh0ID0gYXVkaW9DdHg7XG4gICAgdGhpcy5jaHVua3MgPSBbXTtcbiAgICB0aGlzLmFwcGx5Tm9pc2VHYXRlID0gdHJ1ZTtcblxuICAgIHRoaXMudmlzdWFsaXplciA9IG5ldyBBdWRpb1Zpc3VhbGl6ZXIoJ3Zpc3VhbGl6ZXInLCB7XG4gICAgICB0eXBlOiAnd2F2ZScsXG4gICAgICB3aWR0aDogNzAwLCBoZWlnaHQ6IDUwMCxcbiAgICAgIHN0cm9rZVN0eWxlOiAncmdiKDI1NSwgMjU1LCAyNTUpJ1xuICAgIH0pO1xuXG4gICAgdGhpcy5nZXRVc2VyTWVkaWEoKTtcblxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZWNvcmQtYnV0dG9uJykuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgZXZlbnQgPT4ge1xuICAgICAgaWYgKCF0aGlzLnN0cmVhbSB8fCAhdGhpcy5zdHJlYW0uYWN0aXZlKSB7XG4gICAgICAgIGFsZXJ0KCdSZXF1aXJlIHRvIGFjY2VzcyB0byB5b3VyIG1pY3JvcGhvbmUuJyk7XG4gICAgICAgIGV2ZW50LnRhcmdldC5jaGVja2VkID0gZmFsc2U7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgaWYgKCF0aGlzLm1lZGlhUmVjb3JkZXIgfHx0aGlzLm1lZGlhUmVjb3JkZXIuc3RyZWFtLmlkICE9PSB0aGlzLnN0cmVhbS5pZCkge1xuICAgICAgICB0aGlzLm1lZGlhUmVjb3JkZXIgPSBuZXcgTWVkaWFSZWNvcmRlcih0aGlzLnN0cmVhbSk7XG4gICAgICAgIHRoaXMubWVkaWFSZWNvcmRlci5vbnN0b3AgPSB0aGlzLm9uU3RvcC5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLm1lZGlhUmVjb3JkZXIub25kYXRhYXZhaWxhYmxlID0gdGhpcy5vbkRhdGFBdmFpbGFibGUuYmluZCh0aGlzKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGV2ZW50LnRhcmdldC5jaGVja2VkKSB7XG4gICAgICAgIHRoaXMubWVkaWFSZWNvcmRlci5zdGFydCgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5tZWRpYVJlY29yZGVyLnN0b3AoKTtcbiAgICAgIH1cbiAgICB9LCBmYWxzZSk7XG5cbiAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5TmFtZSgnYW5hbHlzZXItdHlwZScpLmZvckVhY2goaW5wdXQgPT4ge1xuICAgICAgaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgZXZlbnQgPT4ge1xuICAgICAgICB0aGlzLnZpc3VhbGl6ZXIuc2V0VHlwZShldmVudC50YXJnZXQudmFsdWUpO1xuICAgICAgfSlcbiAgICB9KTtcblxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbnB1dC1jaGVjaycpLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIGV2ZW50ID0+IHtcbiAgICAgIGlmIChldmVudC50YXJnZXQuY2hlY2tlZCkge1xuICAgICAgICB0aGlzLnN0b3BBdWRpb1NvdXJjZSgpO1xuICAgICAgICB0aGlzLmdldFVzZXJNZWRpYSgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5zdG9wVXNlck1lZGlhKCk7XG4gICAgICAgIHRoaXMubG9hZFNvdW5kKFVSTHMub3JnYW4pO1xuICAgICAgfVxuICAgIH0sIGZhbHNlKTtcblxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdub2lzZS1nYXRlJykuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgZXZlbnQgPT4ge1xuICAgICAgdGhpcy5hcHBseU5vaXNlR2F0ZSA9ICEhZXZlbnQudGFyZ2V0LmNoZWNrZWQ7XG4gICAgfSwgZmFsc2UpO1xuICB9XG5cbiAgb25TdG9wIChlKSB7XG4gICAgbGV0IGJsb2IgPSBuZXcgQmxvYih0aGlzLmNodW5rcywgeyAndHlwZScgOiAnYXVkaW8vb2dnOyBjb2RlY3M9b3B1cycgfSk7XG4gICAgbGV0IGF1ZGlvVVJMID0gd2luZG93LlVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYik7XG4gICAgdGhpcy5jaHVua3MgPSBbXTtcblxuICAgIHRoaXMubG9hZFNvdW5kKGF1ZGlvVVJMLCAoKSA9PiB7XG4gICAgICB0aGlzLnN0b3BBdWRpb1NvdXJjZSgpO1xuICAgICAgdGhpcy5nZXRVc2VyTWVkaWEoKTtcbiAgICB9KTtcbiAgfVxuXG4gIG9uRGF0YUF2YWlsYWJsZSAoZSkge1xuICAgIGNvbnNvbGUubG9nKCdvbmRhdGFhdmFpbGFibGUnLCBlLmRhdGEpO1xuICAgIHRoaXMuY2h1bmtzLnB1c2goZS5kYXRhKTtcbiAgfVxuXG4gIGxvYWRTb3VuZCh1cmwsIG9uZW5kZWQpIHtcbiAgICByZXR1cm4gbG9hZFNvdW5kKHVybClcbiAgICAudGhlbigoZXZlbnQpID0+IHtcbiAgICAgIGxldCB7IHJlc3BvbnNlIH0gPSBldmVudC50YXJnZXQ7XG5cbiAgICAgIHRoaXMuY29udGV4dC5kZWNvZGVBdWRpb0RhdGEocmVzcG9uc2UsIGJ1ZmZlciA9PiB7XG4gICAgICAgIGxldCBzb3VyY2UgPSBuZXcgQXVkaW9CdWZmZXJTb3VyY2VOb2RlKHRoaXMuY29udGV4dCwgeyBidWZmZXIgfSk7XG4gICAgICAgIGxldCBhbmFseXNlciA9IG5ldyBBbmFseXNlck5vZGUodGhpcy5jb250ZXh0KTtcblxuICAgICAgICBpZiAodGhpcy5hcHBseU5vaXNlR2F0ZSkge1xuICAgICAgICAgIGxldCBub2lzZUdhdGUgPSBuZXcgTm9pc2VHYXRlTm9kZSh0aGlzLmNvbnRleHQpO1xuXG4gICAgICAgICAgc291cmNlLmNvbm5lY3Qobm9pc2VHYXRlKTtcbiAgICAgICAgICBub2lzZUdhdGUuY29ubmVjdChhbmFseXNlcik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc291cmNlLmNvbm5lY3QoYW5hbHlzZXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgYW5hbHlzZXIuY29ubmVjdCh0aGlzLmNvbnRleHQuZGVzdGluYXRpb24pO1xuICAgICAgICBzb3VyY2Uuc3RhcnQoKTtcbiAgICAgICAgc291cmNlLm9uZW5kZWQgPSBvbmVuZGVkO1xuXG4gICAgICAgIHRoaXMudmlzdWFsaXplci5jb25uZWN0KGFuYWx5c2VyKTtcbiAgICAgICAgdGhpcy5zb3VyY2UgPSBzb3VyY2U7XG4gICAgICB9KTtcbiAgICB9KVxuICAgIC5jYXRjaChlID0+IGNvbnNvbGUubG9nKGUpKTtcbiAgfVxuXG4gIHN0b3BBdWRpb1NvdXJjZSgpIHtcbiAgICBpZiAodGhpcy5zb3VyY2UpIHtcbiAgICAgIHRoaXMuc291cmNlLnN0b3AoKTtcbiAgICB9XG4gIH1cblxuICBzdG9wVXNlck1lZGlhKCkge1xuICAgIGlmICh0aGlzLnN0cmVhbSAmJiB0aGlzLnN0cmVhbS5hY3RpdmUpIHtcbiAgICAgIGxldCB0cmFja3MgPSB0aGlzLnN0cmVhbS5nZXRUcmFja3MoKTtcbiAgICAgIHRyYWNrcy5mb3JFYWNoKHRyYWNrID0+IHRyYWNrLnN0b3AoKSk7XG4gICAgfVxuICB9XG5cbiAgZ2V0VXNlck1lZGlhKCkge1xuICAgIHRoaXMuc3RvcFVzZXJNZWRpYSgpO1xuICAgIG5hdmlnYXRvci5tZWRpYURldmljZXMuZ2V0VXNlck1lZGlhKHsgYXVkaW86IHRydWUgfSlcbiAgICAudGhlbigoc3RyZWFtKSA9PiB7XG4gICAgICB0aGlzLnN0cmVhbSA9IHN0cmVhbTtcbiAgICAgIGxldCBzb3VyY2UgPSB0aGlzLmNvbnRleHQuY3JlYXRlTWVkaWFTdHJlYW1Tb3VyY2Uoc3RyZWFtKTtcbiAgICAgIGxldCBhbmFseXNlciA9IG5ldyBBbmFseXNlck5vZGUodGhpcy5jb250ZXh0KTtcblxuICAgICAgbGV0IHdhdiA9IFdhdihzb3VyY2UpO1xuXG4gICAgICBpZiAodGhpcy5hcHBseU5vaXNlR2F0ZSkge1xuICAgICAgICBsZXQgbm9pc2VHYXRlID0gbmV3IE5vaXNlR2F0ZU5vZGUodGhpcy5jb250ZXh0KTtcbiAgICAgICAgLy8gc291cmNlLmNvbm5lY3Qobm9pc2VHYXRlKTtcbiAgICAgICAgLy8gbm9pc2VHYXRlLmNvbm5lY3QoYW5hbHlzZXIpO1xuICAgICAgICB3YXZcbiAgICAgICAgLmNvbm5lY3Qobm9pc2VHYXRlKVxuICAgICAgICAuY29ubmVjdChhbmFseXNlcilcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNvdXJjZS5jb25uZWN0KGFuYWx5c2VyKTtcbiAgICAgIH1cbiAgICAgIHdhdi5vdXRwdXQoKTtcbiAgICAgIC8vIGFuYWx5c2VyLmNvbm5lY3QodGhpcy5jb250ZXh0LmRlc3RpbmF0aW9uKTtcblxuICAgICAgdGhpcy52aXN1YWxpemVyLmNvbm5lY3QoYW5hbHlzZXIpO1xuXG4gICAgICB0aGlzLnNvdXJjZSA9IHNvdXJjZTtcbiAgICB9KVxuICAgIC5jYXRjaCgoZSkgPT4ge1xuICAgICAgY29uc29sZS5sb2coZSk7XG4gICAgfSk7XG4gIH1cbn1cblxubmV3IEFwcChhdWRpb0N0eCk7IiwiY29uc3QgV0FWRSA9ICd3YXZlJztcbmNvbnN0IEZSRVFVRU5DWSA9ICdmcmVxdWVuY3knO1xuXG53aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCB3aW5kb3cubW96UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8IHdpbmRvdy53ZWJraXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgd2luZG93Lm1zUmVxdWVzdEFuaW1hdGlvbkZyYW1lO1xud2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lID0gd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lIHx8IHdpbmRvdy5tb3pDYW5jZWxBbmltYXRpb25GcmFtZTtcblxuY29uc3QgREVGQVVMVCA9IHtcbiAgYmFja2dyb3VuZENvbG9yOiAncmdiKDI1LCAyNSwgMjUpJyxcbiAgaGVpZ2h0OiAzMDAsXG4gIGxpbmVXaWR0aDogMixcbiAgc3Ryb2tlU3R5bGU6ICdyZ2IoMCwgMCwgMCknLFxuICB0eXBlOiBGUkVRVUVOQ1ksXG4gIHdpZHRoOiAzMDAsXG59O1xuXG5jbGFzcyBBdWRpb1Zpc3VhbGl6ZXIge1xuICBjb25zdHJ1Y3RvcihjYW52YXNJZCwgb3B0aW9ucyA9IHt9KSB7XG4gICAgdGhpcy5hbmltYXRpb25GcmFtZUlkID0gbnVsbDtcbiAgICB0aGlzLmRhdGFBcnJheSA9IG51bGw7XG5cbiAgICB0aGlzLm9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCBERUZBVUxULCBvcHRpb25zKTtcblxuICAgIGxldCBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChjYW52YXNJZCk7XG4gICAgdGhpcy5jYW52YXNDdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuICAgIGNhbnZhcy53aWR0aCA9IHRoaXMub3B0aW9ucy53aWR0aDtcbiAgICBjYW52YXMuaGVpZ2h0ID0gdGhpcy5vcHRpb25zLmhlaWdodDtcbiAgfVxuXG4gIGluaXRCeXRlQnVmZmVyIChmcmVxdWVuY3lCaW5Db3VudCkge1xuICAgIGlmICghdGhpcy5kYXRhQXJyYXkgfHwgdGhpcy5kYXRhQXJyYXkubGVuZ3RoICE9PSBmcmVxdWVuY3lCaW5Db3VudCkge1xuICAgICAgcmV0dXJuIG5ldyBGbG9hdDMyQXJyYXkoZnJlcXVlbmN5QmluQ291bnQpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmRhdGFBcnJheTtcbiAgfVxuXG4gIGNvbm5lY3QgKGFuYWx5c2VyKSB7XG4gICAgdGhpcy51cGRhdGVBbmFseXNlcihhbmFseXNlcik7XG4gIH1cblxuICBkaXNjb25uZWN0ICgpIHtcbiAgICBjYW5jZWxBbmltYXRpb25GcmFtZSh0aGlzLmFuaW1hdGlvbkZyYW1lSWQpO1xuICB9XG5cbiAgdXBkYXRlQW5hbHlzZXIoYW5hbHlzZXIpIHtcbiAgICB0aGlzLnJlbmRlcihhbmFseXNlcik7XG5cbiAgICB0aGlzLmFuaW1hdGlvbkZyYW1lSWQgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRoaXMudXBkYXRlQW5hbHlzZXIuYmluZCh0aGlzLCBhbmFseXNlcikpO1xuICB9XG5cbiAgc2V0VHlwZSh0eXBlKSB7XG4gICAgdGhpcy5vcHRpb25zLnR5cGUgPSB0eXBlID09PSBGUkVRVUVOQ1kgPyBGUkVRVUVOQ1kgOiBXQVZFO1xuICB9XG5cbiAgcmVuZGVyIChhbmFseXNlcikge1xuICAgIHRoaXMuZGF0YUFycmF5ID0gdGhpcy5pbml0Qnl0ZUJ1ZmZlcihhbmFseXNlci5mcmVxdWVuY3lCaW5Db3VudCk7XG5cbiAgICBzd2l0Y2godGhpcy5vcHRpb25zLnR5cGUpIHtcbiAgICAgIGNhc2UgV0FWRTpcbiAgICAgICAgYW5hbHlzZXIuZ2V0RmxvYXRUaW1lRG9tYWluRGF0YSh0aGlzLmRhdGFBcnJheSk7XG4gICAgICAgIHRoaXMucmVuZGVyV2F2ZSh0aGlzLmRhdGFBcnJheSwgdGhpcy5jYW52YXNDdHgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgRlJFUVVFTkNZOlxuICAgICAgICBhbmFseXNlci5nZXRGbG9hdEZyZXF1ZW5jeURhdGEodGhpcy5kYXRhQXJyYXkpO1xuICAgICAgICB0aGlzLnJlbmRlckZyZXF1ZW5jeSh0aGlzLmRhdGFBcnJheSwgdGhpcy5jYW52YXNDdHgpO1xuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICByZW5kZXJXYXZlKGRhdGFBcnJheSwgY2FudmFzQ3R4KSB7XG4gICAgbGV0IGJ1ZmZlckxlbmd0aCA9IGRhdGFBcnJheS5sZW5ndGg7XG4gICAgbGV0IHggPSAwO1xuICAgIGxldCB7IHdpZHRoLCBoZWlnaHQsIHN0cm9rZVN0eWxlLCBsaW5lV2lkdGgsIGJhY2tncm91bmRDb2xvciB9ID0gdGhpcy5vcHRpb25zO1xuXG4gICAgY2FudmFzQ3R4LnN0cm9rZVN0eWxlID0gc3Ryb2tlU3R5bGU7XG4gICAgY2FudmFzQ3R4LmxpbmVXaWR0aCA9IGxpbmVXaWR0aDtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYnVmZmVyTGVuZ3RoOyBpKyspIHtcbiAgICAgIGxldCB5ID0gaGVpZ2h0IC8gMiArIGRhdGFBcnJheVtpXSAqIDIwMDtcblxuICAgICAgaWYgKGkgPT09IDApIHtcbiAgICAgICAgeCA9IDA7XG4gICAgICAgIGNhbnZhc0N0eC5jbGVhclJlY3QoMCwgMCwgd2lkdGgsIGhlaWdodCk7XG4gICAgICAgIGNhbnZhc0N0eC5maWxsU3R5bGUgPSBiYWNrZ3JvdW5kQ29sb3I7XG4gICAgICAgIGNhbnZhc0N0eC5maWxsUmVjdCgwLCAwLCB3aWR0aCwgaGVpZ2h0KTtcbiAgICAgICAgY2FudmFzQ3R4LmJlZ2luUGF0aCgpO1xuXG4gICAgICAgIGNhbnZhc0N0eC5tb3ZlVG8oeCwgeSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjYW52YXNDdHgubGluZVRvKHgsIHkpO1xuICAgICAgfVxuXG4gICAgICB4ICs9IHdpZHRoIC8gYnVmZmVyTGVuZ3RoO1xuICAgIH1cblxuICAgIGNhbnZhc0N0eC5zdHJva2UoKTtcbiAgfVxuXG4gIHJlbmRlckZyZXF1ZW5jeShkYXRhQXJyYXksIGNhbnZhc0N0eCkge1xuICAgIGxldCB7IHdpZHRoLCBoZWlnaHQsIGJhY2tncm91bmRDb2xvciB9ID0gdGhpcy5vcHRpb25zO1xuICAgIGxldCBidWZmZXJMZW5ndGggPSBkYXRhQXJyYXkubGVuZ3RoO1xuXG4gICAgbGV0IGJhckhlaWdodDtcbiAgICBsZXQgYmFyV2lkdGggPSB3aWR0aCAvIGJ1ZmZlckxlbmd0aDtcbiAgICBsZXQgeCA9IDA7XG5cbiAgICBjYW52YXNDdHguZmlsbFN0eWxlID0gYmFja2dyb3VuZENvbG9yO1xuICAgIGNhbnZhc0N0eC5maWxsUmVjdCgwLCAwLCB3aWR0aCwgaGVpZ2h0KTtcblxuICAgIGZvcihsZXQgaSA9IDA7IGkgPCBidWZmZXJMZW5ndGg7IGkrKykge1xuICAgICAgYmFySGVpZ2h0ID0gLSBkYXRhQXJyYXlbaV0gKiAyO1xuXG4gICAgICBjYW52YXNDdHguZmlsbFN0eWxlID0gYHJnYigke35+KDI1NSAtIE1hdGgucG93KC1iYXJIZWlnaHQgLyAxNSwgMikpfSwgNTAsIDUwKWA7XG4gICAgICBjYW52YXNDdHguZmlsbFJlY3QoeCwgaGVpZ2h0LCBiYXJXaWR0aCwgYmFySGVpZ2h0IC0gaGVpZ2h0IC8gMik7XG5cbiAgICAgIHggKz0gYmFyV2lkdGggKyAxO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBBdWRpb1Zpc3VhbGl6ZXI7IiwibGV0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xubGV0IGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xubGV0IG1vdW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3Zpc3VhbGl6ZXItbW91bnQnKTtcbmNhbnZhcy53aWR0aCA9IDUwMDtcbmNhbnZhcy5oZWlnaHQgPSA1MDA7XG5cbi8vIGZ1bmN0aW9uIHRyYW5zZm9ybUltYWdlQXJyYXkoYXJyYXkpIHtcbi8vICAgbGV0IGJ1ZmZlckxlbmd0aCA9IGFycmF5Lmxlbmd0aDtcbi8vICAgZm9yIChsZXQgcGl4ZWwgPSAwOyBwaXhlbCA8PSBidWZmZXJMZW5ndGg7IHBpeGVsIC09IDQpIHtcbi8vICAgICBsZXQgciA9IE1hdGgucmFuZG9tKCk7XG4vLyAgICAgaW1nRGF0YS5kYXRhW3BpeGVsXSA9IDE7XG4vLyAgICAgaW1nRGF0YS5kYXRhW3BpeGVsICsgMV0gPSAxO1xuLy8gICAgIGltZ0RhdGEuZGF0YVtwaXhlbCArIDJdID0gMjU1ICogTWF0aC5wb3cociwgZGltbmVzcykgfCAwO1xuLy8gICAgIGltZ0RhdGEuZGF0YVtwaXhlbCArIDNdID0gMjU1O1xuLy8gICB9XG4vLyB9XG5cbmNsYXNzIEltYWdlQXVkaW9saXplciB7XG4gIGNvbnN0cnVjdG9yKGF1ZGlvQ3R4KSB7XG4gICAgdGhpcy5hdWRpb0N0eCA9IGF1ZGlvQ3R4O1xuICAgIC8vIHRoaXMuZ2V0SW1hZ2UoaW1hZ2VTcmMsIHRoaXMuaW1hZ2VPbmxhbmQpO1xuICB9XG5cbiAgZ2V0SW1hZ2VEYXRhKGltZykge1xuICAgIGxldCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICBsZXQgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgbGV0IHsgd2lkdGgsIGhlaWdodCB9ID0gaW1nO1xuXG4gICAgY2FudmFzLndpZHRoID0gd2lkdGggfHwgNTAwO1xuICAgIGNhbnZhcy5oZWlnaHQgPSBoZWlnaHQgfHwgNTAwO1xuICAgIGN0eC5kcmF3SW1hZ2UoaW1nLCAwLCAwKTtcblxuICAgIHJldHVybiBjdHguZ2V0SW1hZ2VEYXRhKDAsIDAsIHdpZHRoLCBoZWlnaHQpXG4gIH1cblxuICBnZXRJbWFnZSAodXJsLCBjYWxsYmFjaykge1xuICAgIGxldCBpbWcgPSBuZXcgSW1hZ2UoKTtcbiAgICBpbWcub25sb2FkID0gY2FsbGJhY2suYmluZCh0aGlzLCBpbWcpO1xuICAgIGltZy5zcmMgPSB1cmw7XG5cbiAgICByZXR1cm4gaW1nO1xuICB9XG5cbiAgc2NhbGVJbWFnZVRvQXVkaW8gKGFycikge1xuICAgIHJldHVybiBhcnIubWFwKHAgPT4gKChwIC8gMTI3LjUpIC0gMSkpO1xuICB9XG5cbiAgZmxvYXQzMkFycmF5VG9BdWRpb0J1ZmZlciAoYXVkaW9CdWZmZXIsIGltZ0FycmF5LCBjaGFubmVsTnVtYmVyID0gMCkge1xuICAgIGxldCBhcnJheSA9IHRoaXMuc2NhbGVJbWFnZVRvQXVkaW8oaW1nQXJyYXkpO1xuICAgIGF1ZGlvQnVmZmVyLmNvcHlUb0NoYW5uZWwoYXJyYXksIGNoYW5uZWxOdW1iZXIpO1xuXG4gICAgcmV0dXJuIGF1ZGlvQnVmZmVyO1xuICB9XG5cbiAgdG9BdWRpb0J1ZmZlcihhcnJheXMpIHtcbiAgICBsZXQgYXVkaW9CdWZmZXIgPSB0aGlzLmF1ZGlvQ3R4LmNyZWF0ZUJ1ZmZlcihhcnJheXMubGVuZ3RoLCBhcnJheXNbMF0ubGVuZ3RoLCB0aGlzLmF1ZGlvQ3R4LnNhbXBsZVJhdGUpO1xuXG4gICAgZm9yKGxldCBpID0gMDsgaSA8IGFycmF5cy5sZW5ndGg7IGkrKykge1xuICAgICAgYXVkaW9CdWZmZXIgPSB0aGlzLmZsb2F0MzJBcnJheVRvQXVkaW9CdWZmZXIoYXVkaW9CdWZmZXIsIGFycmF5c1tpXSwgaSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGF1ZGlvQnVmZmVyO1xuICB9XG5cbiAgc2VwYXJhdGVDb2xvckxheWVyKGltZ0FycmF5KSB7XG4gICAgbGV0IGFycmF5cyA9IFtdO1xuXG4gICAgYXJyYXlzWzBdID0gaW1nQXJyYXkuZmlsdGVyKChfLCBpKSA9PiAoaSsxKSAlIDQgPT0gMSk7XG4gICAgYXJyYXlzWzFdID0gaW1nQXJyYXkuZmlsdGVyKChfLCBpKSA9PiAoaSsxKSAlIDQgPT0gMik7XG4gICAgYXJyYXlzWzJdID0gaW1nQXJyYXkuZmlsdGVyKChfLCBpKSA9PiAoaSsxKSAlIDQgPT0gMyk7XG4gICAgYXJyYXlzWzNdID0gaW1nQXJyYXkuZmlsdGVyKChfLCBpKSA9PiAoaSsxKSAlIDQgPT0gMCk7XG5cbiAgICByZXR1cm4gYXJyYXlzO1xuICB9XG5cbiAgaW1hZ2VPbmxhbmQgKGltZykge1xuICAgIGxldCBpZGF0YSA9IHRoaXMuZ2V0SW1hZ2VEYXRhKGltZyk7XG5cbiAgICBsZXQgaW1nRmxvYXRBcnJheSA9IG5ldyBGbG9hdDMyQXJyYXkoaWRhdGEuZGF0YSk7XG4gICAgbGV0IGFycmF5cyA9IHRoaXMuc2VwYXJhdGVDb2xvckxheWVyKGltZ0Zsb2F0QXJyYXkpO1xuXG4gICAgbGV0IGF1ZGlvQnVmZmVyID0gdGhpcy50b0F1ZGlvQnVmZmVyKGFycmF5cyk7XG5cbiAgICBhdWRpb1Zpc3VhbGl6ZXIudmlzdWFsaXplKGF1ZGlvQnVmZmVyKTtcbiAgfVxufVxuXG5jb25zdCBpYSA9IG5ldyBJbWFnZUF1ZGlvbGl6ZXIobmV3IEF1ZGlvQ29udGV4dCgpKTtcbi8vIGlhLmdldEltYWdlKCcuL2ltYWdlcy9zZXJlbmEucG5nJywgaWEuaW1hZ2VPbmxhbmQpOyIsIihmdW5jdGlvbigpIHtcbiAgdmFyIHByb21pc2lmaWVkT2xkR1VNID0gZnVuY3Rpb24oY29uc3RyYWludHMsIHN1Y2Nlc3NDYWxsYmFjaywgZXJyb3JDYWxsYmFjaykge1xuXG4gICAgdmFyIGdldFVzZXJNZWRpYSA9IChuYXZpZ2F0b3IuZ2V0VXNlck1lZGlhIHx8XG4gICAgICBuYXZpZ2F0b3Iud2Via2l0R2V0VXNlck1lZGlhIHx8XG4gICAgICBuYXZpZ2F0b3IubW96R2V0VXNlck1lZGlhIHx8XG4gICAgICBuYXZpZ2F0b3IubXNHZXRVc2VyTWVkaWEpO1xuXG4gICAgaWYoIWdldFVzZXJNZWRpYSkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignZ2V0VXNlck1lZGlhIGlzIG5vdCBpbXBsZW1lbnRlZCBpbiB0aGlzIGJyb3dzZXInKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHN1Y2Nlc3NDYWxsYmFjaywgZXJyb3JDYWxsYmFjaykge1xuICAgICAgZ2V0VXNlck1lZGlhLmNhbGwobmF2aWdhdG9yLCBjb25zdHJhaW50cywgc3VjY2Vzc0NhbGxiYWNrLCBlcnJvckNhbGxiYWNrKTtcbiAgICB9KTtcbiAgfVxuXG4gIGlmKG5hdmlnYXRvci5tZWRpYURldmljZXMgPT09IHVuZGVmaW5lZCkge1xuICAgIG5hdmlnYXRvci5tZWRpYURldmljZXMgPSB7fTtcbiAgfVxuXG4gIGlmKG5hdmlnYXRvci5tZWRpYURldmljZXMuZ2V0VXNlck1lZGlhID09PSB1bmRlZmluZWQpIHtcbiAgICBuYXZpZ2F0b3IubWVkaWFEZXZpY2VzLmdldFVzZXJNZWRpYSA9IHByb21pc2lmaWVkT2xkR1VNO1xuICB9XG59KSgpOyIsImZ1bmN0aW9uIFdhdiAoc291cmNlKSB7XG4gIHJldHVybiBuZXcgV2F2LmZuLmluaXQoc291cmNlKTtcbn1cblxuV2F2LmZuID0gV2F2LnByb3RvdHlwZSA9IHtcbiAgY29uc3RydWN0b3I6IFdhdixcbiAgbGVuZ3RoOiAwLFxuXG4gIGNvbm5lY3Q6IGZ1bmN0aW9uIChub2RlKSB7XG4gICAgdmFyIGxhc3ROb2RlID0gdGhpcy5sYXN0KCk7XG4gICAgaWYgKGxhc3ROb2RlKSB7XG4gICAgICBsYXN0Tm9kZS5jb25uZWN0KG5vZGUpO1xuICAgIH1cbiAgICB0aGlzLnB1c2gobm9kZSk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICBkaXNjb25uZWN0OiBmdW5jdGlvbiAobm9kZSkge1xuICAgIHZhciBhcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgIHZhciBpbmRleCA9IHRoaXMuaW5kZXhPZihub2RlKTtcblxuICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgIG5vZGUuZGlzY29ubmVjdC5hcHBseShub2RlLCBhcmdzKTtcbiAgICAgIHRoaXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICBvdXRwdXQ6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbGFzdE5vZGUgPSB0aGlzLmxhc3QoKTtcbiAgICBpZiAobGFzdE5vZGUpIHtcbiAgICAgIGxhc3ROb2RlLmNvbm5lY3QodGhpcy5jb250ZXh0LmRlc3RpbmF0aW9uKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc29sZS5lcnJvcignTm8gQXVkaW9Ob2RlIGNvbm5lY3QgdG8gb3V0cHV0LicpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIHNldFBhcmFtczogZnVuY3Rpb24gKG5vZGUsIGF1ZGlvUGFyYW1zKSB7XG4gICAgZm9yIChsZXQgcGFyYW0gaW4gYXVkaW9QYXJhbXMpIHtcbiAgICAgIGxldCB2YWx1ZSA9IGF1ZGlvUGFyYW1zW3BhcmFtXTtcbiAgICAgIGlmIChub2RlW3BhcmFtXSBpbnN0YW5jZW9mIEF1ZGlvUGFyYW0pIHtcbiAgICAgICAgbm9kZVtwYXJhbV0udmFsdWUgPSB2YWx1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5vZGVbcGFyYW1dID0gdmFsdWU7XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIGxhc3Q6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5nZXQoLTEpO1xuICB9LFxuXG4gIGdldDogZnVuY3Rpb24oIG51bSApIHtcbiAgICBpZiAobnVtID09IG51bGwpIHtcbiAgICAgIHJldHVybiBzbGljZS5jYWxsKCB0aGlzICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bSA8IDAgPyB0aGlzW251bSArIHRoaXMubGVuZ3RoXSA6IHRoaXNbbnVtXTtcbiAgfSxcblxuICBlcTogZnVuY3Rpb24gKGkpIHtcbiAgICB2YXIgbGVuID0gdGhpcy5sZW5ndGgsXG4gICAgICBqID0gK2kgKyAoIGkgPCAwID8gbGVuIDogMCApO1xuICAgIHJldHVybiB0aGlzLnB1c2hTdGFjayggaiA+PSAwICYmIGogPCBsZW4gPyBbdGhpc1tqXV0gOiBbXSApO1xuICB9LFxuXG4gIHB1c2hTdGFjazogZnVuY3Rpb24gKGVsZW1zKSB7XG4gICAgdmFyIHJldCA9IFdhdi5tZXJnZSh0aGlzLmNvbnN0cnVjdG9yKCksIGVsZW1zKTtcbiAgICByZXQucHJldk9iamVjdCA9IHRoaXM7XG5cbiAgICByZXR1cm4gcmV0O1xuICB9LFxuXG4gIGVhY2g6IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgIHJldHVybiBXYXYuZWFjaCh0aGlzLCBjYWxsYmFjayk7XG4gIH0sXG5cbiAgbWFwOiBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICByZXR1cm4gdGhpcy5wdXNoU3RhY2soV2F2Lm1hcCh0aGlzLCBmdW5jdGlvbihlbGVtLCBpKSB7XG4gICAgICByZXR1cm4gY2FsbGJhY2suY2FsbChlbGVtLCBpLCBlbGVtKTtcbiAgICB9KSk7XG4gIH0sXG5cbiAgcHVzaDogZnVuY3Rpb24gKCkge1xuICAgIFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKS5mb3JFYWNoKChhcmcpID0+IHtcbiAgICAgIHRoaXNbdGhpcy5sZW5ndGhdID0gYXJnO1xuICAgICAgdGhpcy5sZW5ndGgrKztcbiAgICB9KVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIHNwbGljZTogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBBcnJheS5wcm90b3R5cGUuc3BsaWNlO1xuICB9LFxuICBpbmRleE9mOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5pbmRleE9mO1xuICB9LFxufVxuXG5XYXYuZXh0ZW5kID0gV2F2LmZuLmV4dGVuZCA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIG9wdGlvbnMsIG5hbWUsIHNyYywgY29weSwgY29weUlzQXJyYXksIGNsb25lLFxuICAgIHRhcmdldCA9IGFyZ3VtZW50c1sgMCBdIHx8IHt9LFxuICAgIGkgPSAxLFxuICAgIGxlbmd0aCA9IGFyZ3VtZW50cy5sZW5ndGgsXG4gICAgZGVlcCA9IGZhbHNlO1xuXG4gIC8vIEhhbmRsZSBhIGRlZXAgY29weSBzaXR1YXRpb25cbiAgaWYgKCB0eXBlb2YgdGFyZ2V0ID09PSBcImJvb2xlYW5cIiApIHtcbiAgICBkZWVwID0gdGFyZ2V0O1xuXG4gICAgLy8gU2tpcCB0aGUgYm9vbGVhbiBhbmQgdGhlIHRhcmdldFxuICAgIHRhcmdldCA9IGFyZ3VtZW50c1sgaSBdIHx8IHt9O1xuICAgIGkrKztcbiAgfVxuXG4gIC8vIEhhbmRsZSBjYXNlIHdoZW4gdGFyZ2V0IGlzIGEgc3RyaW5nIG9yIHNvbWV0aGluZyAocG9zc2libGUgaW4gZGVlcCBjb3B5KVxuICBpZiAoIHR5cGVvZiB0YXJnZXQgIT09IFwib2JqZWN0XCIgJiYgIVdhdi5pc0Z1bmN0aW9uKCB0YXJnZXQgKSApIHtcbiAgICB0YXJnZXQgPSB7fTtcbiAgfVxuXG4gIC8vIEV4dGVuZCBXYXYgaXRzZWxmIGlmIG9ubHkgb25lIGFyZ3VtZW50IGlzIHBhc3NlZFxuICBpZiAoIGkgPT09IGxlbmd0aCApIHtcbiAgICB0YXJnZXQgPSB0aGlzO1xuICAgIGktLTtcbiAgfVxuXG4gIGZvciAoIDsgaSA8IGxlbmd0aDsgaSsrICkge1xuXG4gICAgLy8gT25seSBkZWFsIHdpdGggbm9uLW51bGwvdW5kZWZpbmVkIHZhbHVlc1xuICAgIGlmICggKCBvcHRpb25zID0gYXJndW1lbnRzWyBpIF0gKSAhPSBudWxsICkge1xuXG4gICAgICAvLyBFeHRlbmQgdGhlIGJhc2Ugb2JqZWN0XG4gICAgICBmb3IgKCBuYW1lIGluIG9wdGlvbnMgKSB7XG4gICAgICAgIHNyYyA9IHRhcmdldFsgbmFtZSBdO1xuICAgICAgICBjb3B5ID0gb3B0aW9uc1sgbmFtZSBdO1xuXG4gICAgICAgIC8vIFByZXZlbnQgbmV2ZXItZW5kaW5nIGxvb3BcbiAgICAgICAgaWYgKCB0YXJnZXQgPT09IGNvcHkgKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZWN1cnNlIGlmIHdlJ3JlIG1lcmdpbmcgcGxhaW4gb2JqZWN0cyBvciBhcnJheXNcbiAgICAgICAgaWYgKCBkZWVwICYmIGNvcHkgJiYgKCBXYXYuaXNQbGFpbk9iamVjdCggY29weSApIHx8XG4gICAgICAgICAgKCBjb3B5SXNBcnJheSA9IEFycmF5LmlzQXJyYXkoIGNvcHkgKSApICkgKSB7XG5cbiAgICAgICAgICBpZiAoIGNvcHlJc0FycmF5ICkge1xuICAgICAgICAgICAgY29weUlzQXJyYXkgPSBmYWxzZTtcbiAgICAgICAgICAgIGNsb25lID0gc3JjICYmIEFycmF5LmlzQXJyYXkoIHNyYyApID8gc3JjIDogW107XG5cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2xvbmUgPSBzcmMgJiYgV2F2LmlzUGxhaW5PYmplY3QoIHNyYyApID8gc3JjIDoge307XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gTmV2ZXIgbW92ZSBvcmlnaW5hbCBvYmplY3RzLCBjbG9uZSB0aGVtXG4gICAgICAgICAgdGFyZ2V0WyBuYW1lIF0gPSBXYXYuZXh0ZW5kKCBkZWVwLCBjbG9uZSwgY29weSApO1xuXG4gICAgICAgIC8vIERvbid0IGJyaW5nIGluIHVuZGVmaW5lZCB2YWx1ZXNcbiAgICAgICAgfSBlbHNlIGlmICggY29weSAhPT0gdW5kZWZpbmVkICkge1xuICAgICAgICAgIHRhcmdldFsgbmFtZSBdID0gY29weTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIFJldHVybiB0aGUgbW9kaWZpZWQgb2JqZWN0XG4gIHJldHVybiB0YXJnZXQ7XG59O1xuXG5XYXYuZXh0ZW5kKHtcbiAgbWVyZ2U6IGZ1bmN0aW9uKCBmaXJzdCwgc2Vjb25kICkge1xuICAgIHZhciBsZW4gPSArc2Vjb25kLmxlbmd0aCxcbiAgICAgIGogPSAwLFxuICAgICAgaSA9IGZpcnN0Lmxlbmd0aDtcblxuICAgIGZvciAoIDsgaiA8IGxlbjsgaisrICkge1xuICAgICAgZmlyc3RbIGkrKyBdID0gc2Vjb25kWyBqIF07XG4gICAgfVxuXG4gICAgZmlyc3QubGVuZ3RoID0gaTtcblxuICAgIHJldHVybiBmaXJzdDtcbiAgfVxufSk7XG5cbnZhciBpbml0ID0gV2F2LmZuLmluaXQgPSBmdW5jdGlvbihzb3VyY2UpIHtcbiAgaWYgKCFzb3VyY2UpIHsgcmV0dXJuIHRoaXM7IH1cblxuICB0aGlzLmNvbnRleHQgPSBzb3VyY2UuY29udGV4dDtcbiAgdGhpcy5zb3VyY2UgPSBzb3VyY2U7XG4gIHRoaXNbMF0gPSBzb3VyY2U7XG5cbiAgdGhpcy5sZW5ndGggPSAxO1xuXG4gIHJldHVybiB0aGlzO1xufVxuXG5pbml0LnByb3RvdHlwZSA9IFdhdi5mbjtcblxud2luZG93LldhdiA9IFdhdjtcblxuZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gV2F2OyJdfQ==
