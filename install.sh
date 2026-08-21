#!/usr/bin/env bash
# Continuum one-shot installer.
# Installs/updates the app into ~/continuum. Never touches Electron userData
# (settings, tokens, transcripts) or project CONTINUUM.md files.
set -euo pipefail

REPO_URL="${CONTINUUM_REPO_URL:-https://github.com/Haroon966/Continuum.git}"
BRANCH="${CONTINUUM_BRANCH:-main}"
INSTALL_DIR="${CONTINUUM_HOME:-$HOME/continuum}"
BIN_DIR="${CONTINUUM_BIN_DIR:-$HOME/.local/bin}"
LAUNCHER="$BIN_DIR/continuum"
MIN_NODE_MAJOR=20

info()  { printf '==> %s\n' "$*"; }
warn()  { printf 'warn: %s\n' "$*" >&2; }
die()   { printf 'error: %s\n' "$*" >&2; exit 1; }

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Missing required command: $1"
}

node_major() {
  node -p "process.versions.node.split('.')[0]" 2>/dev/null || echo 0
}

print_node_hints() {
  cat <<'EOF' >&2

Install Node.js 20+ (22 recommended), then re-run this script.
  https://nodejs.org/

Hints:
  macOS:   brew install node
  Ubuntu:  sudo apt update && sudo apt install -y nodejs npm
           (or use https://github.com/nodesource/distributions for Node 20+)
  Fedora:  sudo dnf install -y nodejs npm
  Windows: use install.ps1 instead (PowerShell):
           irm https://raw.githubusercontent.com/Haroon966/Continuum/main/install.ps1 | iex
           Node: winget install OpenJS.NodeJS.LTS
           Git:  winget install Git.Git
  nvm:     curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
           then: nvm install 22 && nvm use 22

EOF
}

check_node() {
  if ! command -v node >/dev/null 2>&1; then
    warn "Node.js not found on PATH."
    print_node_hints
    die "Node.js ${MIN_NODE_MAJOR}+ is required."
  fi
  if ! command -v npm >/dev/null 2>&1; then
    warn "npm not found on PATH (Node install may be incomplete)."
    print_node_hints
    die "npm is required."
  fi
  local major
  major="$(node_major)"
  if [[ "$major" -lt "$MIN_NODE_MAJOR" ]]; then
    warn "Node.js $(node -v) is too old (need ${MIN_NODE_MAJOR}+)."
    print_node_hints
    die "Please upgrade Node.js."
  fi
  info "Node $(node -v), npm $(npm -v)"
}

clone_or_update() {
  if [[ -d "$INSTALL_DIR/.git" ]]; then
    info "Updating existing install at $INSTALL_DIR"
    (
      cd "$INSTALL_DIR"
      # Preserve local user edits in the clone if any; only update tracked app code.
      git fetch --prune origin "$BRANCH"
      git checkout "$BRANCH"
      git pull --ff-only origin "$BRANCH"
    )
  elif [[ -e "$INSTALL_DIR" ]]; then
    die "$INSTALL_DIR exists but is not a Continuum git clone. Move/rename it, then re-run."
  else
    info "Cloning Continuum into $INSTALL_DIR"
    git clone --branch "$BRANCH" --single-branch "$REPO_URL" "$INSTALL_DIR"
  fi
}

install_deps() {
  info "Installing npm dependencies"
  (cd "$INSTALL_DIR" && npm install)
}

install_launcher() {
  mkdir -p "$BIN_DIR"
  cat >"$LAUNCHER" <<EOF
#!/usr/bin/env bash
set -euo pipefail
cd "$INSTALL_DIR"
exec npm run electron:dev -- "\$@"
EOF
  chmod +x "$LAUNCHER"
  info "Launcher installed: $LAUNCHER"

  case ":$PATH:" in
    *":$BIN_DIR:"*) ;;
    *)
      warn "$BIN_DIR is not on PATH."
      cat <<EOF >&2
Add this to your shell config (~/.bashrc / ~/.zshrc), then open a new terminal:
  export PATH="\$HOME/.local/bin:\$PATH"
EOF
      ;;
  esac
}

# Linux app menu / dock: Exec must be the continuum launcher (starts Vite).
# Raw electron → blank window (no UI on :5173).
install_linux_desktop() {
  case "$(uname -s)" in
    Linux) ;;
    *) return 0 ;;
  esac

  local apps_dir="$HOME/.local/share/applications"
  local hicolor="$HOME/.local/share/icons/hicolor"
  local icon_src="$INSTALL_DIR/public/icon.png"
  local desktop="$apps_dir/continuum.desktop"

  mkdir -p "$apps_dir"
  cat >"$desktop" <<EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=Continuum
Comment=One project. Any agent. No lost context.
Exec=$LAUNCHER
Icon=continuum
Terminal=false
Categories=Development;IDE;
StartupWMClass=Continuum
StartupNotify=true
EOF
  info "Desktop entry: $desktop"

  if [[ -f "$icon_src" ]]; then
    local size
    for size in 32 48 64 128 256 512; do
      mkdir -p "$hicolor/${size}x${size}/apps"
      cp -f "$icon_src" "$hicolor/${size}x${size}/apps/continuum.png"
    done
    gtk-update-icon-cache -f -t "$hicolor" >/dev/null 2>&1 || true
  fi
  update-desktop-database "$apps_dir" >/dev/null 2>&1 || true
}

print_start_help() {
  cat <<EOF

Continuum is ready.

Start anytime:
  continuum
  # Linux: also Apps menu → Continuum
  # or:
  cd $INSTALL_DIR && npm run electron:dev

Install dir:  $INSTALL_DIR
User data:    Electron userData (settings/token/transcripts) — not modified by this installer
Projects:     CONTINUUM.md lives in each project folder you open — not modified by this installer

EOF
}

maybe_start() {
  if [[ ! -t 0 ]]; then
    info "Non-interactive stdin — skipping start prompt."
    return 0
  fi
  local reply=n
  printf 'Start Continuum now? [y/N] '
  read -r reply || true
  case "${reply:-}" in
    y|Y|yes|YES)
      info "Starting Continuum…"
      exec "$LAUNCHER"
      ;;
    *)
      info "Skipped start. Run: continuum"
      ;;
  esac
}

main() {
  need_cmd git
  check_node
  clone_or_update
  install_deps
  install_launcher
  install_linux_desktop
  print_start_help
  maybe_start
}

main "$@"
