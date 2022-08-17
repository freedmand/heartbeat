import { useEffect, useState } from "react";
import { SectionList, Text, TouchableOpacity, View } from "react-native";
import { Device } from "react-native-ble-plx";
import { bleManager, hrService } from "../ble";
import { styles } from "../styles";

interface BluetoothItemProps {
  device: Device;
  setDevice: (device: Device) => void;
}

const BluetoothItem = ({ device, setDevice }: BluetoothItemProps) => {
  return (
    <View style={styles.item}>
      <TouchableOpacity style={styles.button} onPress={() => setDevice(device)}>
        <Text style={styles.title}>{device.name}</Text>
      </TouchableOpacity>
    </View>
  );
};

interface BluetoothSelectProps {
  setSelectedDevice: (device: Device) => void;
}

export const BluetoothSelect = ({
  setSelectedDevice,
}: BluetoothSelectProps) => {
  const [devices, setDevices] = useState<Device[]>([]);

  const setDevice = (device: Device) => {
    // Function to set device right before passing to parent callback
    bleManager.stopDeviceScan();
    setSelectedDevice(device);
  };

  useEffect(() => {
    const subscription = bleManager.onStateChange((state) => {
      if (state === "PoweredOn") {
        // Scan and connect
        bleManager.startDeviceScan([hrService], null, (error, device) => {
          if (error) {
            // Handle error (scanning will be stopped automatically)
            console.error(JSON.stringify(error, null, 2));
            return;
          }

          if (device) {
            const existingDevices = [...devices];
            const existingIndex = existingDevices.findIndex(
              (existingDevice) => device.id === existingDevice.id
            );
            if (existingIndex !== -1) {
              // Update the existing index
              existingDevices[existingIndex] = device;
            } else {
              // Push new device
              existingDevices.push(device);
            }
            setDevices(existingDevices);
          }
        });

        console.log("powered on!");
        subscription.remove();
      }
    }, true);
    return () => subscription.remove();
  }, [bleManager]);

  return (
    <SectionList
      sections={[
        {
          title: "Heart rate monitors",
          data: devices,
        },
      ]}
      renderItem={({ item }) => (
        <BluetoothItem device={item} setDevice={setDevice} />
      )}
      renderSectionHeader={({ section: { title } }) => (
        <Text style={styles.header}>{title}</Text>
      )}
    />
  );
};
