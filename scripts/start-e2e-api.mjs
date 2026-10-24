import { spawn } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(repoRoot, "data");

mkdirSync(dataDir, { recursive: true });
for (const suffix of ["", "-wal", "-shm"]) {
  rmSync(path.join(dataDir, `still-e2e.db${suffix}`), { force: true });
}

const cargoBinDir = path.join(homedir(), ".cargo", "bin");
const cargoExe = path.join(cargoBinDir, process.platform === "win32" ? "cargo.exe" : "cargo");

const child = spawn(existsSync(cargoExe) ? cargoExe : "cargo", ["run", "-p", "still-core"], {
  cwd: repoRoot,
  stdio: "inherit",
  env: {
    ...process.env,
    DATABASE_URL: "sqlite://data/still-e2e.db",
    STILL_BIND: "127.0.0.1:8788",
    PATH: `${cargoBinDir}${path.delimiter}${process.env.PATH ?? ""}`,
  },
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    if (!child.killed) child.kill(signal);
  });
}

child.on("exit", (code) => process.exit(code ?? 0));
