import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native";

import { HeartMonitor } from "./src/components/HeartMonitor";
import { styles } from "./src/styles";

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <HeartMonitor />
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}
