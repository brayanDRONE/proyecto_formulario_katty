import { useEffect, useState } from "react";
import { usePageVisible, useReducedMotion } from "../hooks";

const RESTING = "/mascotas/apolo/reposo.png";
const PAW_UP = "/mascotas/apolo/patita-arriba.png";

export default function ApoloAnimado() {
  const [greeting, setGreeting] = useState(false);
  const [leftPaw, setLeftPaw] = useState(false);
  const reducedMotion = useReducedMotion();
  const pageVisible = usePageVisible();

  useEffect(() => {
    if (reducedMotion || !pageVisible) {
      setGreeting(false);
      return;
    }

    let timeout: ReturnType<typeof setTimeout>;
    let side = false;

    const scheduleGreeting = () => {
      timeout = setTimeout(
        () => {
          side = !side;
          setLeftPaw(side);
          setGreeting(true);
          timeout = setTimeout(() => {
            setGreeting(false);
            scheduleGreeting();
          }, 300);
        },
        7000 + Math.random() * 5000,
      );
    };

    scheduleGreeting();
    return () => clearTimeout(timeout);
  }, [pageVisible, reducedMotion]);

  return (
    <img
      className={`mascot-image${greeting && leftPaw ? " mascot-image--flipped" : ""}`}
      src={greeting ? PAW_UP : RESTING}
      alt="Apolo, la mascota que saluda"
      fetchPriority="high"
    />
  );
}
