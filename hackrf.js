var HackRF = function HackRF(connection) {
  this.connection = connection;
};


// Static Enums
HackRF.vendorRequest = {
	SET_TRANSCEIVER_MODE: 1,
	MAX2837_WRITE: 2,
	MAX2837_READ: 3,
	SI5351C_WRITE: 4,
	SI5351C_READ: 5,
	SAMPLE_RATE_SET: 6,
	BASEBAND_FILTER_BANDWIDTH_SET: 7,
	RFFC5071_WRITE: 8,
	RFFC5071_READ: 9,
	SPIFLASH_ERASE: 10,
	SPIFLASH_WRITE: 11,
	SPIFLASH_READ: 12,
	BOARD_ID_READ: 14,
	VERSION_STRING_READ: 15,
	SET_FREQ: 16,
	AMP_ENABLE: 17,
	BOARD_PARTID_SERIALNO_READ: 18,
	SET_LNA_GAIN: 19,
	SET_VGA_GAIN: 20,
	SET_TXVGA_GAIN: 21,
	ANTENNA_ENABLE: 23,
	SET_FREQ_EXPLICIT: 24
};

HackRF.transceiverMode = {
  OFF: 0,
  RECEIVE: 1,
  TRANSMIT: 2
};

HackRF.max2837FrequencyTable = [
  1750000,
	2500000,
	3500000,
	5000000,
	5500000,
	6000000,
	7000000,
	8000000,
	9000000,
	10000000,
	12000000,
	14000000,
	15000000,
	20000000,
	24000000,
	28000000,
	0
];

HackRF.boardIdName = {
  0: 'Jellybean',
  1: 'Jawbreaker',
  2: 'HackRF One',
  0xFF: 'INVALID'
};


// Class method to enumerate all connected HackRF devices. Calls successCallback
// once for each device found, or errorCallback once with a human readable error
// message.
HackRF.open = function(successCallback, errorCallback) {
  chrome.usb.findDevices({
    "vendorId": 7504,
    "productId": 24713
  }, function(connections) {
    if(connections.length > 0) {
      connections.forEach(function(item) {
        successCallback(new HackRF(item));
      });
    }else{
      errorCallback('No HackRF devices found');
    }
  });
};


HackRF.prototype._controlTransfer = function(transferInfo, successCallback, errorCallback) {
  transferInfo.requestType = 'vendor';
  transferInfo.recipient = 'device';
  chrome.usb.controlTransfer(this.connection, transferInfo, function(event) {
    event.transferInfo = transferInfo;
    if(event && event.resultCode == 0) {
      successCallback(event);
    }else{
      errorCallback(event);
    }
  });
};

// Set the transceiver mode. mode argument should be one of the values from
// the HackRF.transceiverMode enum
HackRF.prototype.set_transceiver_mode = function(mode, successCallback, errorCallback) {
  this._controlTransfer({
    direction: 'out',
    request: HackRF.vendorRequest.SET_TRANSCEIVER_MODE,
    value: mode,
    index: 0,
    data: new ArrayBuffer('')
  }, successCallback, errorCallback);
};

HackRF.prototype.set_vga_gain = function(gain, successCallback, errorCallback) {
  this._controlTransfer({
    direction: 'in',
    request: HackRF.vendorRequest.SET_VGA_GAIN,
    value: 0,
    index: gain,
    length: 1
  }, successCallback, errorCallback);
};

HackRF.prototype.set_lna_gain = function(gain, successCallback, errorCallback) {
  this._controlTransfer({
    direction: 'in',
    request: HackRF.vendorRequest.SET_LNA_GAIN,
    value: 0,
    index: gain,
    length: 1
  }, successCallback, errorCallback);
};

// TODO: figure out how to pack a struct here.
HackRF.prototype.set_freq = function(freq_hz, successCallback, errorCallback) {
  var buffer = new ArrayBuffer(8);
  var view = new DataView(buffer);
  view.setUint32(0, Math.floor(freq_hz / 1000000), true); // freq_mhz
  view.setUint32(4, Math.floor(freq_hz % 1000000), true); // freq_hz

  this._controlTransfer({
    direction: 'out',
    request: HackRF.vendorRequest.SET_FREQ,
    value: 0,
    index: 0,
    data: buffer,
    length: view.byteLength
  }, successCallback, errorCallback);
};

HackRF.prototype.max2837_read = function(registerNumber, successCallback, errorCallback) {
  this._controlTransfer({
    direction: 'in',
    request: HackRF.vendorRequest.MAX2837_READ,
    value: 0,
    index: registerNumber,
    length: 2
  }, successCallback, errorCallback);
};

HackRF.prototype.board_id_read = function(successCallback, errorCallback) {
  this._controlTransfer({
    direction: 'in',
    request: HackRF.vendorRequest.BOARD_ID_READ,
    value: 0,
    index: 0,
    length: 1
  }, successCallback, errorCallback);
};

HackRF.prototype.version_string_read = function(successCallback, errorCallback) {
  this._controlTransfer({
    direction: 'in',
    request: HackRF.vendorRequest.VERSION_STRING_READ,
    value: 0,
    index: 0,
    length: 255
  }, successCallback, errorCallback);
};

HackRF.prototype.receive = function(successCallback, errorCallback) {
  chrome.usb.bulkTransfer(this.connection, {
    direction: 'in',
    endpoint: 129, // LIBUSB_ENDPOINT_IN | 1 == 0x81 == 129
    length: 262144
  }, function(event) {
    console.log(event);
    if(event && event.resultCode === 0) {
      successCallback(event);
    }else{
      errorCallback(event);
    }
  });
};

HackRF.prototype.close = function(callback) {
  console.log(this.connection);
  chrome.usb.closeDevice(this.connection, callback);
};