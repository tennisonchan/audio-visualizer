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

    this.visualizer = new AudioVisualizer('visualizer', {
      type: 'wave',
      width: 700, height: 500,
      strokeStyle: 'rgb(255, 255, 255)'
    });

    this.getUserMedia();

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
        this.loadSound();
      }
    }, false);
  }

  loadSound() {
    loadSound(URLs.organ)
    .then((event) => {
      let { response } = event.target;

      this.context.decodeAudioData(response, buffer => {
        let source = new AudioBufferSourceNode(this.context, { buffer });
        let analyser = new AnalyserNode(this.context);

        source.connect(analyser);
        source.connect(this.context.destination);
        source.start();

        this.visualizer.connect(analyser);
        this.source = source;
      })
      .catch(e => console.log(e));
    });
  }

  stopAudioSource() {
    if (this.source) {
      this.source.stop();
    }
  }

  stopUserMedia() {
    if (this.stream.active) {
      let audioTracks = this.stream.getAudioTracks();
      audioTracks.forEach(track => track.stop());
    }
  }

  getUserMedia() {
    navigator.mediaDevices.getUserMedia({ audio: true })
    .then((stream) => {
      this.stream = stream;
      let source = this.context.createMediaStreamSource(stream);
      let analyser = new AnalyserNode(this.context);
      let noiseGate = new NoiseGateNode(this.context);

      source.connect(noiseGate);
      noiseGate.connect(analyser);
      source.connect(this.context.destination);

      this.visualizer.connect(analyser);

      this.source = source;
    })
    .catch(e => console.log(e));
  }
}

new App(audioCtx);