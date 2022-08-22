import { useEffect, useState } from "react";
import { SectionList, Text, TouchableOpacity, View } from "react-native";
import { BleError, Characteristic, Device } from "react-native-ble-plx";
import { bleManager, hrService, parseHr } from "../ble";
import { styles } from "../styles";

const useFakeDevice = true;

let interval: ReturnType<typeof setInterval> | null = null;
const fakeDevice: Device = {
  id: "fake-device",
  name: "Fake Device 🎢",
  connect: async () => fakeDevice,
  discoverAllServicesAndCharacteristics: async () => fakeDevice,
  cancelConnection: () => {
    if (interval != null) {
      clearInterval(interval);
      interval = null;
    }
  },
  monitorCharacteristicForService: (
    _service: any,
    _characteristic: any,
    callback: (
      error: BleError | null,
      characteristic: Characteristic | null
    ) => void
  ) => {
    const minHeartBeat = 80;
    const maxHeartBeat = 185;
    let currentHeartBeat = 80;
    let direction = 3;
    const randomAmount = 2;

    if (interval != null) {
      clearInterval(interval);
      interval = null;
    }

    interval = setInterval(() => {
      currentHeartBeat += direction;
      currentHeartBeat +=
        Math.floor(Math.random() * (randomAmount * 2 + 1)) - randomAmount;
      if (currentHeartBeat >= maxHeartBeat) {
        currentHeartBeat = maxHeartBeat;
        direction *= -1;
      } else if (currentHeartBeat <= minHeartBeat) {
        currentHeartBeat = minHeartBeat;
        direction *= -1;
      }
      (callback as any)(null, {
        heartBeat: {
          heartRate: currentHeartBeat,
          contactDetected: false,
          energyExpended: null,
          rrIntervalPresent: false,
          rrIntervals: [],
        },
      } as { heartBeat: ReturnType<typeof parseHr> });
    }, 1000);
  },
} as any as Device;

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

  const allDevices = useFakeDevice ? [...devices, fakeDevice] : devices;

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
          data: allDevices,
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
