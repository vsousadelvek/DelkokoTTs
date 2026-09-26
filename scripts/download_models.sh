#!/usr/bin/env bash
# Download the Kokoro-82M ONNX model files with SHA-256 integrity checks.
# Used by the Docker build and as a fallback to `git lfs pull`.
set -euo pipefail

MODELS_DIR="${1:-backend/storage/models}"
BASE_URL="https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0"

MODEL_FILE="kokoro-v1.0.onnx"
MODEL_SHA256="7d5df8ecf7d4b1878015a32686053fd0eebe2bc377234608764cc0ef3636a6c5"
VOICES_FILE="voices-v1.0.bin"
VOICES_SHA256="bca610b8308e8d99f32e6fe4197e7ec01679264efed0cac9140fe9c29f1fbf7d"

mkdir -p "$MODELS_DIR"

download_and_verify() {
  local file="$1" expected="$2"
  local path="$MODELS_DIR/$file"
  if [ -f "$path" ] && echo "$expected  $path" | sha256sum -c - >/dev/null 2>&1; then
    echo "$file already present and verified"
    return
  fi
  echo "Downloading $file..."
  curl -fSL --retry 3 -o "$path" "$BASE_URL/$file"
  echo "$expected  $path" | sha256sum -c -
}

download_and_verify "$MODEL_FILE" "$MODEL_SHA256"
download_and_verify "$VOICES_FILE" "$VOICES_SHA256"
echo "Model files ready in $MODELS_DIR"
