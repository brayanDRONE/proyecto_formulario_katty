import { useEffect, useState } from "react";
import { usePageVisible, useReducedMotion } from "../hooks";

const OPEN = "/mascotas/atenea/ojos-abiertos.png";
const CLOSED = "/mascotas/atenea/ojos-cerrados.png";

export default function AteneaAnimada() {
  const [blinking, setBlinking] = useState(false);
  const reducedMotion = useReducedMotion();
  const pageVisible = usePageVisible();

  useEffect(() => {
    if (reducedMotion || !pageVisible) {
      setBlinking(false);
      return;
    }

    let timeout: ReturnType<typeof setTimeout>;
    let blinkCount = 0;

    const scheduleBlink = () => {
      timeout = setTimeout(
        () => {
          setBlinking(true);
          timeout = setTimeout(() => {
            setBlinking(false);
            blinkCount += 1;
            if (blinkCount % 3 === 0) {
              timeout = setTimeout(() => {
                setBlinking(true);
                timeout = setTimeout(() => {
                  setBlinking(false);
                  scheduleBlink();
                }, 150);
              }, 260);
            } else {
              scheduleBlink();
            }
          }, 150);
        },
        5000 + Math.random() * 3000,
      );
    };

    scheduleBlink();
    return () => clearTimeout(timeout);
  }, [pageVisible, reducedMotion]);

  return (
    <img
      className="mascot-image"
      src={blinking ? CLOSED : OPEN}
      alt="Atenea, la mascota del centro"
      fetchPriority="high"
    />
  );
}
