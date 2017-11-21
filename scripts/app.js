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

function onSuccess (stream) {
  var mediaRecorder = new MediaRecorder(stream);

  recordEl.onclick = function() {
    mediaRecorder.start();
    console.log(mediaRecorder.state);
    console.log("recorder started");
    recordEl.style.background = "red";

    stopEl.disabled = false;
    recordEl.disabled = true;
  }

  stopEl.onclick = function() {
    mediaRecorder.stop();
    console.log(mediaRecorder.state);
    console.log("recorder stopped");
    recordEl.style.background = "";
    recordEl.style.color = "";
    // mediaRecorder.requestData();

    stopEl.disabled = true;
    recordEl.disabled = false;
  }

  mediaRecorder.onstop = function(e) {
    console.log("data available after MediaRecorder.stop() called.");

    var clipName = prompt('Enter a name for your sound clip?','My unnamed clip');
    console.log(clipName);
    var clipContainer = document.createElement('article');
    var clipLabel = document.createElement('p');
    var audio = document.createElement('audio');
    var deleteButton = document.createElement('button');

    clipContainer.classList.add('clip');
    audio.setAttribute('controls', '');
    deleteButton.textContent = 'Delete';
    deleteButton.className = 'delete';

    if(clipName === null) {
      clipLabel.textContent = 'My unnamed clip';
    } else {
      clipLabel.textContent = clipName;
    }

    clipContainer.appendChild(audio);
    clipContainer.appendChild(clipLabel);
    clipContainer.appendChild(deleteButton);
    soundClipsEl.appendChild(clipContainer);

    audio.controls = true;
    var blob = new Blob(chunks, { 'type' : 'audio/ogg; codecs=opus' });
    chunks = [];
    var audioURL = window.URL.createObjectURL(blob);
    audio.src = audioURL;
    console.log("recorder stopped");

    deleteButton.onclick = function(e) {
      evtTgt = e.target;
      evtTgt.parentNode.parentNode.removeChild(evtTgt.parentNode);
    }

    clipLabel.onclick = function() {
      var existingName = clipLabel.textContent;
      var newClipName = prompt('Enter a new name for your sound clip?');
      if(newClipName === null) {
        clipLabel.textContent = existingName;
      } else {
        clipLabel.textContent = newClipName;
      }
    }
  }

  mediaRecorder.ondataavailable = function(e) {
    console.log('ondataavailable', e.data);
    chunks.push(e.data);
  }
}

new App(audioCtx);