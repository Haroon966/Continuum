import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

export function TerminalPanel({ id }: { id: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const term = new Terminal({
      convertEol: true,
      fontFamily: "IBM Plex Mono, ui-monospace, monospace",
      fontSize: 13,
      theme: {
        background: "#ffffff",
        foreground: "#134e4a",
        cursor: "#0d9488",
        selectionBackground: "#ccfbf1",
      },
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(ref.current);
    fit.fit();
    termRef.current = term;

    void window.continuum.terminalStart(id, term.cols, term.rows);

    const offData = window.continuum.onTerminalData((payload) => {
      if (payload.id === id) term.write(payload.data);
    });
    const offExit = window.continuum.onTerminalExit((payload) => {
      if (payload.id === id) term.writeln("\r\n[session exited]");
    });

    const disposable = term.onData((data) => {
      void window.continuum.terminalWrite(id, data);
    });

    const onResize = () => {
      fit.fit();
      void window.continuum.terminalResize(id, term.cols, term.rows);
    };
    window.addEventListener("resize", onResize);

    return () => {
      offData();
      offExit();
      disposable.dispose();
      window.removeEventListener("resize", onResize);
      void window.continuum.terminalKill(id);
      term.dispose();
      termRef.current = null;
    };
  }, [id]);

  return <div className="terminal-wrap" ref={ref} />;
}
