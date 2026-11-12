import { useEffect } from "react";
import AteneaAnimada from "./AteneaAnimada";
import ApoloAnimado from "./ApoloAnimado";
import KyraAnimada from "./KyraAnimada";

const MASCOT_IMAGES = [
  "/mascotas/kyra/boca-cerrada.png",
  "/mascotas/kyra/boca-abierta.png",
  "/mascotas/atenea/ojos-abiertos.png",
  "/mascotas/atenea/ojos-cerrados.png",
  "/mascotas/apolo/reposo.png",
  "/mascotas/apolo/patita-arriba.png",
];

export default function MascotasHeader() {
  useEffect(() => {
    for (const source of MASCOT_IMAGES) {
      const image = new Image();
      image.src = source;
    }
  }, []);

  return (
    <div className="mascots" aria-label="Kyra, Atenea y Apolo">
      <div className="mascot mascot--kyra">
        <KyraAnimada />
      </div>
      <div className="mascot mascot--atenea">
        <AteneaAnimada />
      </div>
      <div className="mascot mascot--apolo">
        <ApoloAnimado />
      </div>
    </div>
  );
}
