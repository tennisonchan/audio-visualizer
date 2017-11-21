import NoiseGateNode from 'noise-gate';
import AudioVisualizer from './audio-visualizer.js';

window.AudioContext = window.AudioContext || window.webkitAudioContext;

const audioCtx = new AudioContext();
const URLs = {
  blueyellow: 'audios/blueyellow.wav',
  techno: 'audios/techno.wav',
  organ: 'audios/organ-echo-chords.wav',
};

function loadSound(url) {
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = resolve;
    xhr.onerror = reject;

    xhr.send();
  })
}

class App {
  constructor(audioCtx) {
    this.stream = null;
    this.source = null;
    this.context = audioCtx;
    this.chunks = [];
    this.applyNoiseGate = true;

    this.visualizer = new AudioVisualizer('visualizer', {
      type: 'wave',
      width: 700, height: 500,
      strokeStyle: 'rgb(255, 255, 255)'
    });

    this.getUserMedia();

    document.getElementById('record-button').addEventListener('change', event => {
      if (!this.stream || !this.stream.active) {
        alert('Require to access to your microphone.');
        event.target.checked = false;
        return false;
      }

      if (!this.mediaRecorder ||this.mediaRecorder.stream.id !== this.stream.id) {
        this.mediaRecorder = new MediaRecorder(this.stream);
        this.mediaRecorder.onstop = this.onStop.bind(this);
        this.mediaRecorder.ondataavailable = this.onDataAvailable.bind(this);
      }

      if (event.target.checked) {
        this.mediaRecorder.start();
      } else {
        this.mediaRecorder.stop();
      }
    }, false);

    document.getElementsByName('analyser-type').forEach(input => {
      input.addEventListener('change', event => {
        this.visualizer.setType(event.target.value);
      })
    });

    document.getElementById('input-check').addEventListener('change', event => {
      if (event.target.checked) {
        this.stopAudioSource();
        this.getUserMedia();
      } else {
        this.stopUserMedia();
        this.loadSound(URLs.organ);
      }
    }, false);

    document.getElementById('noise-gate').addEventListener('change', event => {
      this.applyNoiseGate = !!event.target.checked;
    }, false);
  }

  onStop (e) {
    let blob = new Blob(this.chunks, { 'type' : 'audio/ogg; codecs=opus' });
    let audioURL = window.URL.createObjectURL(blob);
    this.chunks = [];

    this.loadSound(audioURL, () => {
      this.stopAudioSource();
      this.getUserMedia();
    });
  }

  onDataAvailable (e) {
    console.log('ondataavailable', e.data);
    this.chunks.push(e.data);
  }

  loadSound(url, onended) {
    return loadSound(url)
    .then((event) => {
      let { response } = event.target;

      this.context.decodeAudioData(response, buffer => {
        let source = new AudioBufferSourceNode(this.context, { buffer });
        let analyser = new AnalyserNode(this.context);

        if (this.applyNoiseGate) {
          let noiseGate = new NoiseGateNode(this.context);

          source.connect(noiseGate);
          noiseGate.connect(analyser);
        } else {
          source.connect(analyser);
        }

        analyser.connect(this.context.destination);
        source.start();
        source.onended = onended;

        this.visualizer.connect(analyser);
        this.source = source;
      });
    })
    .catch(e => console.log(e));
  }

  stopAudioSource() {
    if (this.source) {
      this.source.stop();
    }
  }

  stopUserMedia() {
    if (this.stream && this.stream.active) {
      let tracks = this.stream.getTracks();
      tracks.forEach(track => track.stop());
    }
  }

  getUserMedia() {
    this.stopUserMedia();
    navigator.mediaDevices.getUserMedia({ audio: true })
    .then((stream) => {
      this.stream = stream;
      let source = this.context.createMediaStreamSource(stream);
      let analyser = new AnalyserNode(this.context);

      if (this.applyNoiseGate) {
        let noiseGate = new NoiseGateNode(this.context);
        source.connect(noiseGate);
        noiseGate.connect(analyser);
      } else {
        source.connect(analyser);
      }
      analyser.connect(this.context.destination);

      this.visualizer.connect(analyser);

      this.source = source;
    })
    .catch((e) => {
      console.log(e);
    });
  }
}

new App(audioCtx);