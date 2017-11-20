const FILTER_PARAMS = ['type', 'frequency', 'gain', 'detune', 'Q'];
const COMPRESSOR_PARAMS = ['threshold', 'knee', 'ratio', 'attack', 'release'];
const DEFAULT_COMPRESSOR = {
  threshold: -50,
  knee: 40,
  ratio: 12,
  reduction: -20,
  attack: 0,
  release: 0.25
};
const DEFAULT_FILTER = {
  Q: 8.30,
  frequency: 355,
  gain: 3.0,
  type: 'bandpass',
};

class NoiseGateNode {
  constructor(audioCtx, options = {}) {
    let compressorPramas = this.selectParams(options, COMPRESSOR_PARAMS);
    let filterPramas = this.selectParams(options, FILTER_PARAMS);

    this.compressor = new DynamicsCompressorNode(audioCtx, Object.assign(DEFAULT_COMPRESSOR, compressorPramas));
    this.filter = new BiquadFilterNode(audioCtx, Object.assign(DEFAULT_FILTER, filterPramas));

    this.compressor.connect(this.filter);

    return this.filter;
  }

  selectParams(object, filterArr) {
    return Object.keys(object).reduce(function (opt, p) {
      if (filterArr.includes(p)) {
        opt[p] = object[p];
      }
      return opt;
    }, {});
  }

  setParams(node, audioParams) {
    for (let param in audioParams) {
      let value = audioParams[param];
      if (node[param] instanceof AudioParam) {
        node[param].value = value;
      } else {
        node[param] = value;
      }
    }
  }
}
