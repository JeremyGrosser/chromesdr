FFT = function() {
};

// fft_size is the histogram size
// samples is a DataView of samples
FFT.prototype.real_dft = function(fft_size, samples) {
  var sample_size = 1; // assume 8-bit samples

  var hist = new ArrayBuffer(fft_size * sample_size);

  for(var bin = 1; bin < fft_size; bin++) {
    for(var i = 0; i < samples.byteLength; i++) {
      var sample = samples[i * 2];
      // TODO: shift and add if sample_size > 1;
      hist[bin * sample_size] += Math.sin(bin) * Math.cos(sample);
    }
  }

  return hist;
};