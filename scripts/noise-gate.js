function crossfade(value) {
  // equal-power crossfade
  var gain1 = Math.cos(value * 0.5 * Math.PI);
  var gain2 = Math.cos((1.0 - value) * 0.5 * Math.PI);

  dryGain.gain.value = gain1;
  wetGain.gain.value = gain2;
}

function convertToMono(input) {
  let splitter = audioCtx.createChannelSplitter(2);
  let merger = audioCtx.createChannelMerger(2);

  input.connect(splitter);
  splitter.connect(merger, 0, 0);
  splitter.connect(merger, 0, 1);

  return merger;
}

function initStream (mediaStreamSource) {
  let compressor = audioCtx.createDynamicsCompressor();
  compressor.threshold.value = -50;
  compressor.knee.value = 40;
  compressor.ratio.value = 12;
  compressor.reduction.value = -20;
  compressor.attack.value = 0;
  compressor.release.value = 0.25;

  let filter = audioCtx.createBiquadFilter();
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
  let audioInput = convertToMono(input);

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

  let currentEffectNode = createNoiseGate();

  audioInput.connect(currentEffectNode);

  return audioInput;
}

function createNoiseGate() {
  var inputNode = audioCtx.createGain();
  var rectifier = audioCtx.createWaveShaper();
  let ngFollower = audioCtx.createBiquadFilter();
  let noiseGate = audioCtx.createWaveShaper();
  let gateGain = audioCtx.createGain();

  let bufferLength = 65536;
  let halfBufferLength = bufferLength / 2;

  // min 0, max 0.1, step 0.001, value 0.01
  // let floor = 0.012;
  let floor = 0.1;

  ngFollower.type = "lowpass";
  // min 0.25, max 20, step 0.25, value 10
  ngFollower.frequency.value = 13.0;

  noiseGate.curve = generateNoiseFloorCurve(parseFloat(floor), bufferLength);

  let curve = new Float32Array(bufferLength);
  for (let i = 0; i < bufferLength; i++) {
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

  let halfLength = bufferLength / 2;

  let curve = new Float32Array(bufferLength);
  let mappedFloor = floor * halfLength;

  for (let i = 0; i < halfLength; i++) {
    let value = (i < mappedFloor) ? 0 : 1;

    curve[halfLength - i] = -value;
    curve[halfLength + i] = value;
  }
  curve[0] = curve[1]; // fixing up the end.

  return curve;
}
