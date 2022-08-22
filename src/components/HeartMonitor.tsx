import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { BleError, Characteristic, Device } from "react-native-ble-plx";
import { hrCharacteristic, hrService, parseHr } from "../ble";
import { styles } from "../styles";
import { Adventure, useClockValue } from "./Adventure";
import { BluetoothSelect } from "./BluetoothSelect";

const GRAY = 96;
const BLUE = 116;
const GREEN = 136;
const YELLOW = 156;
const RED = 176;

function getZone(hr: number): number {
  if (hr < GRAY) return 0;
  if (hr < BLUE) return 1;
  if (hr < GREEN) return 2;
  if (hr < YELLOW) return 3;
  if (hr < RED) return 4;
  return 5;
}

const zoneColors = [
  "#999999",
  "#ffffff",
  "#0000ff",
  "#00ff00",
  "#ffff00",
  "#ff0000",
];

export const HeartMonitor = () => {
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [hr, setHr] = useState<number | null>(null);
  const [totalBeats, setTotalBeats] = useState(0);
  const [hrBeats, setHrBeats] = useState(0);
  const [time, setTime] = useState(Date.now());
  const [meps, setMeps] = useState(0);
  const [splats, setSplats] = useState(0);
  const [zoneTimes, setZoneTimes] = useState({
    hr: 0,
    zones: [0, 0, 0, 0, 0, 0],
  });
  const [zone, setZone] = useState(0);

  // An effect to scale the heart beat up and down at a rate
  // equivalent to the current heart rate (hr)
  const toggleScale = (scale: number) => {
    if (scale === 1) return 1.2;
    return 1;
  };

  const [delta, setDelta] = useState(0);
  useClockValue(setDelta);

  useEffect(() => {
    if (hr != null) {
      setHrBeats((hrBeats) => hrBeats + (hr * delta) / 1000 / 60);
    }
  }, [delta, hr]);

  const heartBeatScale =
    (Math.sin(hrBeats * Math.PI * 2) + 1) * 0.05 * (zone + 1) + 1;

  const adjustedHeartrate = hr || 0;

  const bgColor =
    adjustedHeartrate == null || adjustedHeartrate < GRAY
      ? "#ffffff77"
      : adjustedHeartrate < BLUE
      ? "#bfbfbf77"
      : adjustedHeartrate < GREEN
      ? "#81acfc77"
      : adjustedHeartrate < YELLOW
      ? "#81fc8177"
      : adjustedHeartrate < RED
      ? "#fff12b77"
      : "#ff2b2b77";

  const hrCallback = (
    error: BleError | null,
    characteristic: Characteristic | null
  ) => {
    if (error != null) {
      console.error("Characteristic error", error);
      return;
    }

    if (
      characteristic != null &&
      (characteristic.value != null ||
        (characteristic as any).heartBeat != null)
    ) {
      let heartBeat: ReturnType<typeof parseHr>;
      if ((characteristic as any).heartBeat != null) {
        // Use mock heart beat data
        heartBeat = (characteristic as any).heartBeat;
      } else {
        heartBeat = parseHr(characteristic.value!);
      }
      setTotalBeats((beats) => beats + heartBeat.rrIntervals.length);
      setHr(heartBeat.heartRate);
      setZoneTimes((zoneTimes) => ({
        hr: heartBeat.heartRate,
        zones: [...zoneTimes.zones],
      }));
      const zoneLevel = getZone(heartBeat.heartRate);
      setZone(zoneLevel);
      setMeps((meps) => meps + zoneLevel / 60);
      if (zoneLevel >= 4) {
        setSplats((splats) => splats + 1 / 60);
      }
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(Date.now());
      setZoneTimes((zoneTimes) => {
        const hr = zoneTimes.hr;
        const zone = getZone(hr);
        const newZoneTimes = [...zoneTimes.zones];
        newZoneTimes[zone] += 1;
        return { hr, zones: newZoneTimes };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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
            hrCallback
          );
        });
    }

    return () => {
      console.log("canceling");
      selectedDevice?.cancelConnection();
    };
  }, [selectedDevice]);

  const zoneColor = zoneColors[zone];

  return selectedDevice == null ? (
    <BluetoothSelect setSelectedDevice={setSelectedDevice} />
  ) : hr == null ? (
    <Text>{selectedDevice.name}</Text>
  ) : (
    <View style={{ ...styles.full, backgroundColor: "black" }}>
      <View
        style={{
          ...styles.bgView,
          ...styles.fill,
        }}
      >
        <Adventure heartRate={adjustedHeartrate} zone={zone} />
      </View>

      <View
        style={{
          ...styles.container,
          ...styles.fill,
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "transparent",
        }}
      >
        <View
          style={{
            alignItems: "center",
            marginTop: 30,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignContent: "stretch",
              minWidth: "100%",
              alignItems: "center",
            }}
          >
            <Text
              style={{ ...styles.meps, textAlign: "left", marginRight: 20 }}
            >
              {meps.toFixed(2)} MP
            </Text>
            <Text style={{ ...styles.meps, textAlign: "right" }}>
              {splats.toFixed(2)} SP
            </Text>
          </View>
          <Text style={styles.time}>
            {new Date(time).toLocaleTimeString(undefined, {
              hour12: false,
            })}
          </Text>
          <Text
            style={{
              ...styles.heartRate,
              fontSize: 30,
              marginBottom: -5,
              transform: [{ scale: heartBeatScale }],
            }}
          >
            🤍
          </Text>
          <Text style={{ ...styles.heartRate }}>{adjustedHeartrate}</Text>
        </View>
        {/* <Text style={styles.meps}>{meps.toFixed(2)} MEPS</Text>
        <Text style={styles.totalBeats}>Total beats {totalBeats}</Text>
        <Text style={styles.time}>{new Date(time).toLocaleTimeString()}</Text>
        <Text style={{ ...styles.zoneTimes, color: "gainsboro" }}>
          {zoneTimes.zones[0]}
        </Text>
        <Text style={{ ...styles.zoneTimes, color: "gray" }}>
          {zoneTimes.zones[1]}
        </Text>
        <Text style={{ ...styles.zoneTimes, color: "blue" }}>
          {zoneTimes.zones[2]}
        </Text>
        <Text style={{ ...styles.zoneTimes, color: "green" }}>
          {zoneTimes.zones[3]}
        </Text>
        <Text style={{ ...styles.zoneTimes, color: "orange" }}>
          {zoneTimes.zones[4]}
        </Text>
        <Text style={{ ...styles.zoneTimes, color: "red" }}>
          {zoneTimes.zones[5]}
        </Text> */}
      </View>
    </View>
  );
};
