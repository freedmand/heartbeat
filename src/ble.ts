import { BleManager } from "react-native-ble-plx";

export const bleManager = new BleManager();

export const hrService = "180D";
export const hrCharacteristic = "2A37";

// from https://github.com/WebBluetoothCG/demos/blob/gh-pages/heart-rate-sensor/heartRateSensor.js#L33
function parseHeartRateRawData(array: ArrayBuffer) {
  const value = new DataView(array);
  let flags = value.getUint8(0);
  let rate16Bits = flags & 0x1;
  let heartRate: number;
  let contactDetected: boolean = false;
  let energyExpended: number | null = null;
  let rrIntervals: number[] = [];
  let index = 1;
  if (rate16Bits) {
    heartRate = value.getUint16(index, /*littleEndian=*/ true);
    index += 2;
  } else {
    heartRate = value.getUint8(index);
    index += 1;
  }
  let contactDetectedFlag = flags & 0x2;
  let contactSensorPresent = flags & 0x4;
  if (contactSensorPresent) {
    contactDetected = !!contactDetectedFlag;
  }
  let energyPresentFlag = flags & 0x8;
  if (energyPresentFlag) {
    energyExpended = value.getUint16(index, /*littleEndian=*/ true);
    index += 2;
  }
  let rrIntervalPresent = (flags & 0x10) !== 0;
  if (rrIntervalPresent) {
    for (; index + 1 < value.byteLength; index += 2) {
      rrIntervals.push(value.getUint16(index, /*littleEndian=*/ true));
    }
    rrIntervals = rrIntervals;
  }
  return {
    heartRate,
    contactDetected,
    energyExpended,
    rrIntervalPresent,
    rrIntervals,
  };
}

// from https://stackoverflow.com/a/42833475/1404888
const chars =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
const atob = (input: string = "") => {
  let str = input.replace(/=+$/, "");
  let output = "";

  if (str.length % 4 == 1) {
    throw new Error(
      "'atob' failed: The string to be decoded is not correctly encoded."
    );
  }
  for (
    let bc = 0, bs = 0, buffer, i = 0;
    (buffer = str.charAt(i++));
    ~buffer && ((bs = bc % 4 ? bs * 64 + buffer : buffer), bc++ % 4)
      ? (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))))
      : 0
  ) {
    buffer = chars.indexOf(buffer);
  }

  return output;
};

// From https://stackoverflow.com/a/21797381/1404888
function base64ToArrayBuffer(base64: string) {
  const binary_string = atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

export function parseHr(hr: string) {
  return parseHeartRateRawData(base64ToArrayBuffer(hr));
}
