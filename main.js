function writeStatus(msg) {
  document.querySelector('#greeting').innerText += msg;
}

function simpleCallback(msg) {
  return function(event) {
    if(event.resultCode != 0) {
      writeStatus('[ERROR] ' + msg + '\n');
    }else{
      writeStatus('[OK]' + msg + '\n');
    }
  };
}

function arrayBufferToHex(data) {
  var u = new Uint8Array(data);
  var result = '';
  for(var i = 0; i < u.length; i++) {
    var c = u[i].toString(16);
    if(c.length < 2) {
      c = '0' + c;
    }
    result += c + ' ';
  }
  return result;
}

function handleSamples(event, options) {
  //options.device.receive(options);

  var view = new DataView(event.data);
  var fft = new FFT();
  var hist = fft.real_dft(1024, view);
  console.log(hist);

  writeStatus('Received ' + view.byteLength + ' bytes\n');
}

window.onload = function() {
  HackRF.open(function(devices) {
    writeStatus('Enumerated ' + devices.length + ' compatible device(s)\n');
    devices.forEach(function(device) {
      // This callback will be fired for each HackRF device connected to this system.
      writeStatus('Connected!\n');

      device.board_id_read(function(event) {
        var boardId = new Uint8Array(event.data)[0];
        writeStatus(' ' + HackRF.boardIdName[boardId]);
      });

      device.version_string_read(function(event) {
        writeStatus(' (' + String.fromCharCode.apply(null, new Uint8Array(event.data)) + ')\n');
      });

      var config = {
        frequency:      99.1 * 1000000, // 99.1 MHz
        sample_rate:    500000,         // 500 KHz
        sample_period:  0.100,          // 100ms
        vga_gain:       2,              // ?
        lna_gain:       40              // ?
      };
      console.log(config);

      device.set_transceiver_mode(HackRF.transceiverMode.RECEIVE, function() {
        var sample_size = config.sample_rate * config.sample_period * 2; // I/Q is 2 channels

        device.set_vga_gain(config.vga_gain, simpleCallback('Setting VGA gain'));
        device.set_lna_gain(config.lna_gain, simpleCallback('Setting LNA gain'));
        device.set_freq(config.frequency, simpleCallback('Setting frequency'));
        device.set_sample_rate(config.sample_rate, 1, simpleCallback('Setting sample rate'));

        device.receive({
          length: sample_size,
          device: device,
          callback: handleSamples
        });
      });
    });
  });
};