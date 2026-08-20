import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";

export type TerminalSession = {
  write: (data: string) => void;
  resize: (cols: number, rows: number) => void;
  kill: () => void;
};

/**
 * ponytail: Linux `script` gives a PTY without native node-pty/electron rebuild.
 * Upgrade path: node-pty when electron headers available.
 */
export function spawnProjectTerminal(opts: {
  cwd: string;
  env?: Record<string, string>;
  command: string;
  onData: (data: string) => void;
  onExit: () => void;
}): TerminalSession {
  const env = { ...process.env, ...opts.env } as NodeJS.ProcessEnv;

  let child: ChildProcessWithoutNullStreams;

  if (process.platform === "win32") {
    child = spawn("powershell.exe", ["-NoLogo", "-Command", opts.command], {
      cwd: opts.cwd,
      env,
      stdio: ["pipe", "pipe", "pipe"],
    });
  } else {
    // -f /dev/null: typescript session log discarded; -q quiet; -c run command
    child = spawn(
      "script",
      ["-q", "-f", "/dev/null", "-c", opts.command],
      {
        cwd: opts.cwd,
        env,
        stdio: ["pipe", "pipe", "pipe"],
      },
    );
  }

  child.stdout.on("data", (buf: Buffer) => opts.onData(buf.toString("utf8")));
  child.stderr.on("data", (buf: Buffer) => opts.onData(buf.toString("utf8")));
  child.on("exit", () => opts.onExit());
  child.on("error", (err) => {
    opts.onData(`\r\n[terminal error] ${err.message}\r\n`);
    opts.onExit();
  });

  return {
    write: (data: string) => {
      child.stdin.write(data);
    },
    resize: () => {
      // script PTY size follow-up not wired; ponytail ceiling
    },
    kill: () => {
      child.kill();
    },
  };
}
