function writeStatus(msg) {
  document.querySelector('#greeting').innerText += msg;
}

function errorCallback(msg) {
  return function() {
    writeStatus(msg);
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

window.onload = function() {
  HackRF.open(function(device) {
    // This callback will be fired for each HackRF device connected to this system.
    writeStatus('Connected');

    device.board_id_read(function(event) {
      var boardId = new Uint8Array(event.data)[0];
      writeStatus(' ' + HackRF.boardIdName[boardId]);
    });

    device.version_string_read(function(event) {
      writeStatus(' (' + String.fromCharCode.apply(null, new Uint8Array(event.data)) + ')\n');
    });

    device.set_transceiver_mode(HackRF.transceiverMode.RECEIVE, function() {
      device.set_vga_gain(2, null, errorCallback('Error setting VGA gain'));
      device.set_lna_gain(40, null, errorCallback('Error setting LNA gain'));
      device.set_freq(99100000, errorCallback('Set frequency to 99.1 MHz\n'), errorCallback('Error setting frequency'));

      device.receive(function(event) {
        var view = new DataView(event.data);
        writeStatus('Got ' + view.byteLength + ' bytes\n');
      }, errorCallback('Error calling device.receive'));
    }, errorCallback('Error setting transceiver to RECEIVE'));

  }, function(errorMessage) {
    writeStatus(errorMessage);
  });
};