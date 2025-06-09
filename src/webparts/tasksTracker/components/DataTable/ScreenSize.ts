import { useState, useEffect } from "react";

const getDeviceType = (width: number): "mobile" | "tablet" | "laptop" => {
  if (width <= 600) return "mobile";
  if (width <= 1024) return "tablet";
  return "laptop";
};

const useScreenSize = (): "mobile" | "tablet" | "laptop" => {
  const [deviceType, setDeviceType] = useState<"mobile" | "tablet" | "laptop">(
    getDeviceType(window.innerWidth)
  );

  useEffect(() => {
    const handleResize = () => {
      setDeviceType(getDeviceType(window.innerWidth));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return deviceType;
};

export default useScreenSize;
