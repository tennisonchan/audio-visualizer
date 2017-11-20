# Audio Visualizer
A plug-and-play audio visualizer

## [DEMO](https://tennisonchan.github.io/audio-visualizer/)
### Frequency
![Frequency](https://user-images.githubusercontent.com/719938/33041819-9acd96ec-ce7a-11e7-8fb1-6438ef1a2c1a.gif)

### Wave
![Wave](https://user-images.githubusercontent.com/719938/33041822-9bee2686-ce7a-11e7-803a-d3c44ed71a0b.gif)

## Usage
```js

const visualizer = new AudioVisualizer('canvasId', {
  // optional
  type: 'wave',
  width: 700, height: 500,
  lineWidth: 2,
  backgroundColor: 'rgb(25, 25, 25)'
  strokeStyle: 'rgb(255, 255, 255)'
});

// Connect visualizer to an AnalyserNode which connected to the audio source
function getMediaStream (stream) {
  let source = audioContext.createMediaStreamSource(stream);
  let analyser = new AnalyserNode(audioContext);

  source.connect(analyser);
  visualizer.connect(analyser);
}
```
