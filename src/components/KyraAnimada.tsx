import { useEffect, useState } from "react";
import { usePageVisible, useReducedMotion } from "../hooks";

const CLOSED = "/mascotas/kyra/boca-cerrada.png";
const OPEN = "/mascotas/kyra/boca-abierta.png";

export default function KyraAnimada() {
  const [speaking, setSpeaking] = useState(false);
  const reducedMotion = useReducedMotion();
  const pageVisible = usePageVisible();

  useEffect(() => {
    if (reducedMotion || !pageVisible) {
      setSpeaking(false);
      return;
    }

    const startedAt = Date.now();
    let timeout: ReturnType<typeof setTimeout>;
    let isOpen = false;

    const animateMouth = () => {
      const elapsed = Date.now() - startedAt;
      if (elapsed >= 3600) {
        setSpeaking(false);
        return;
      }

      isOpen = !isOpen;
      setSpeaking(isOpen);
      timeout = setTimeout(animateMouth, isOpen ? 180 : 140);
    };

    timeout = setTimeout(animateMouth, 140);
    return () => clearTimeout(timeout);
  }, [pageVisible, reducedMotion]);

  return (
    <img
      className="mascot-image"
      src={speaking ? OPEN : CLOSED}
      alt="Kyra, la mascota que da la bienvenida"
      fetchPriority="high"
    />
  );
}
