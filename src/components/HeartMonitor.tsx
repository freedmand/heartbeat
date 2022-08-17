import { useEffect, useState } from "react";
import { Text } from "react-native";
import { Device } from "react-native-ble-plx";
import { bleManager, hrCharacteristic, hrService, parseHr } from "../ble";
import { styles } from "../styles";
import { BluetoothSelect } from "./BluetoothSelect";

export const HeartMonitor = () => {
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [hr, setHr] = useState<number | null>(null);

  useEffect(() => {
    if (selectedDevice != null) {
      // Set up listener

      selectedDevice
        .connect()
        .then((device) => {
          return device.discoverAllServicesAndCharacteristics();
        })
        .then((device) => {
          console.log("connected to device");
          device.monitorCharacteristicForService(
            hrService,
            hrCharacteristic,
            (error, characteristic) => {
              if (error != null) {
                console.error("Characteristic error", error);
                return;
              }

              if (characteristic != null && characteristic.value != null) {
                const { heartRate } = parseHr(characteristic.value);
                setHr(heartRate);
              }
            }
          );
        });
    }
  }, [selectedDevice]);

  return selectedDevice == null ? (
    <BluetoothSelect setSelectedDevice={setSelectedDevice} />
  ) : hr == null ? (
    <Text>{selectedDevice.name}</Text>
  ) : (
    <Text style={styles.heartRate}>Heart rate: {hr} bpm</Text>
  );
};
