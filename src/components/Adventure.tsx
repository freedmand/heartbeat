import { Canvas, Skia, Fill, Shader, vec } from "@shopify/react-native-skia";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { styles } from "../styles";

const glsl = (x: any) => `${x}`;

const source = Skia.RuntimeEffect.Make(glsl`
  // Current time
  uniform float iTime;
  // Current zone
  uniform float iZone;
  // Width/height of canvas
  uniform vec2 iResolution;

  vec3 black = vec3(0.0, 0.0, 0.0);

  // Zones
  vec3 lightgray = vec3(0.2, 0.2, 0.2);
  vec3 gray = vec3(1.0, 1.0, 1.0);
  vec3 blue = vec3(0.0, 0.0, 1.0);
  vec3 green = vec3(0.0, 1.0, 0.0);
  vec3 yellow = vec3(1.0, 0.8, 0.0);
  vec3 red = vec3(1.0, 0.0, 0.0);

  vec2 line1Start = vec2(-0.05, 1.0);
  vec2 line2Start = vec2(1.05, 1.0);
  vec2 slope1 = vec2(-0.5, 1.0);
  vec2 slope2 = vec2(0.5, 1.0);

  vec2 center = vec2(0.5, 0.5);

  half4 main(vec2 fragcoord) {
    float zone = iZone;
    vec2 uv = fragcoord.xy / iResolution.xy;
    
    vec2 p1 = line1Start + slope1 * dot(uv - line1Start, slope1);
    vec2 p2 = line2Start + slope2 * dot(uv - line2Start, slope2);
    float d1 = distance(p1, uv);
    float d2 = distance(p2, uv);
    float d = min(d1, d2);

    // Determine if point is between two lines
    float between = uv.x > p1.x && uv.x < p2.x ? 1.0 : 0.0;
    float lineProximity = min(abs(uv.x - p1.x), abs(uv.x - p2.x));
    float sy = sin((pow(1.2 - uv.y, 3) * 1.4 + iTime * 0.003) * 80);
    float lineIntensity = mix(1.0, (sy > 0.9 ? ((sy - 0.9) * 10.0) : 0.0), smoothstep(0.0, 0.01, lineProximity));

    vec3 zoneLine = mix(mix(mix(mix(mix(lightgray, gray, smoothstep(0.0, 1.0, zone)), blue, smoothstep(1.0, 2.0, zone)), green, smoothstep(2.0, 3.0, zone)), yellow, smoothstep(3.0, 4.0, zone)), red, smoothstep(4.0, 5.0, zone));

    vec3 color = mix(black, zoneLine, between * lineIntensity * lineIntensity);
    color = mix(black, color, pow(uv.y, 2));

    return half4(color, 1);
  }
`)!;

if (!source) {
  throw new Error("Couldn't compile the shader");
}

const FPS = 250;

// A react hook that will request animation frames and return the time in seconds
export function useClockValue(setDelta: (newDelta: number) => void) {
  useEffect(() => {
    let lastTime = performance.now();
    let frame: number = undefined!;
    const frameCallback = () => {
      // Prevent setting time if faster than fps
      const now = performance.now();
      const delta = now - lastTime;
      if (delta > 1000 / FPS) {
        setDelta(delta);
        lastTime = now;
      }

      frame = requestAnimationFrame(frameCallback);
    };
    frame = requestAnimationFrame(frameCallback);
    return () => cancelAnimationFrame(frame);
  }, []);
}

export const Adventure = ({
  heartRate,
  zone,
}: {
  heartRate: number;
  zone: number;
}) => {
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  const [distance, setDistance] = useState(0);
  const [delta, setDelta] = useState(0);
  const [actualZone, setActualZone] = useState(0);
  useClockValue(setDelta);
  useEffect(() => {
    setDistance(distance + delta * heartRate);
    setActualZone(actualZone + (zone - actualZone) * 0.05);
  }, [delta, heartRate, zone]);

  return (
    <View
      onLayout={(e) => {
        const newWidth = e.nativeEvent.layout.width;
        const newHeight = e.nativeEvent.layout.height;
        console.log("NEW", newWidth);
        if (width != newWidth) setWidth(newWidth);
        if (height != newHeight) setHeight(newHeight);
      }}
    >
      <Canvas style={{ ...styles.full, backgroundColor: "black" }}>
        <Fill>
          <Shader
            source={source}
            uniforms={{
              iTime: distance / 1000,
              iResolution: vec(width, height),
              iZone: actualZone,
            }}
          />
        </Fill>
      </Canvas>
    </View>
  );
};
