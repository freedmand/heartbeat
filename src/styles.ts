import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "100%",
  },
  header: {
    fontSize: 32,
    paddingTop: 40,
  },
  title: {
    fontSize: 20,
  },
  item: {
    padding: 16,
    marginVertical: 8,
    backgroundColor: "gainsboro",
  },
  button: {
    padding: 10,
  },
  heartRate: {
    fontSize: 100,
    fontWeight: "bold",
    color: "white",
    textShadowColor: "black",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
    fontVariant: ["tabular-nums"],
  },
  meps: {
    fontSize: 30,
    color: "white",
    textAlign: "left",
  },
  time: {
    fontSize: 60,
    fontVariant: ["tabular-nums"],
    marginTop: 20,
    marginBottom: 20,
    color: "white",
  },
  totalBeats: {
    fontSize: 30,
    paddingTop: 10,
    paddingBottom: 20,
  },
  zoneTimes: {
    fontSize: 30,
  },
  bgView: {
    backgroundColor: "white",
  },
  full: {
    width: "100%",
    height: "100%",
  },
  fill: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
});
