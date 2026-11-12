import { randomBytes, scryptSync } from "node:crypto";
import { stdin, stdout } from "node:process";

if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
  throw new Error("Run this script from an interactive terminal so the password is not echoed.");
}

stdout.write("Contraseña administrativa (no se mostrará): ");
stdin.setRawMode(true);
stdin.resume();

let password = "";
const onInput = (chunk) => {
  for (const character of chunk.toString("utf8")) {
    if (character === "\u0003") {
      stdin.setRawMode(false);
      stdout.write("\nCancelado.\n");
      process.exit(1);
    }
    if (character === "\r" || character === "\n") {
      stdin.removeListener("data", onInput);
      stdin.setRawMode(false);
      stdin.pause();
      stdout.write("\n");
      if (password.length < 12) {
        throw new Error("La contraseña debe tener al menos 12 caracteres.");
      }
      const salt = randomBytes(16);
      const hash = scryptSync(password, salt, 64);
      password = "";
      stdout.write(`ADMIN_PASSWORD_HASH=scrypt$${salt.toString("base64url")}$${hash.toString("base64url")}\n`);
      return;
    }
    if (character === "\u007f" || character === "\b") {
      password = password.slice(0, -1);
    } else {
      password += character;
    }
  }
};

stdin.on("data", onInput);
