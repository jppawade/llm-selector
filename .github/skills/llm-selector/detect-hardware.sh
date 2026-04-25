#!/usr/bin/env bash
# llm-selector hardware detection script
# Outputs hardware specs for LLM runtime recommendation

OS=$(uname -s)
ARCH=$(uname -m)

# RAM
if [[ "$OS" == "Darwin" ]]; then
  TOTAL_RAM_GB=$(( $(sysctl -n hw.memsize) / 1024 / 1024 / 1024 ))
else
  TOTAL_RAM_GB=$(awk '/MemTotal/ { printf "%.0f", $2/1024/1024 }' /proc/meminfo)
  AVAIL_RAM_GB=$(awk '/MemAvailable/ { printf "%.0f", $2/1024/1024 }' /proc/meminfo)
fi

# CPU
CPU_CORES=$(nproc 2>/dev/null || sysctl -n hw.physicalcpu 2>/dev/null || echo "unknown")
if [[ "$OS" == "Darwin" ]]; then
  CPU_MODEL=$(sysctl -n machdep.cpu.brand_string 2>/dev/null || echo "$ARCH")
else
  CPU_MODEL=$(grep "model name" /proc/cpuinfo | head -1 | cut -d':' -f2 | xargs)
fi

# GPU
GPU_NAME="none"
GPU_VRAM="N/A"
GPU_TYPE="none"

if [[ "$OS" == "Darwin" ]]; then
  GPU_INFO=$(system_profiler SPDisplaysDataType 2>/dev/null)
  GPU_NAME=$(echo "$GPU_INFO" | awk -F': ' '/Chipset Model/{print $2; exit}' | xargs)
  if [[ "$GPU_NAME" == *"Apple"* ]]; then
    GPU_TYPE="apple_silicon"
    # On Apple Silicon, unified memory = GPU memory
    GPU_VRAM="${TOTAL_RAM_GB}GB (unified)"
  else
    GPU_TYPE="integrated"
    GPU_VRAM=$(echo "$GPU_INFO" | awk -F': ' '/VRAM/{print $2; exit}' | xargs)
  fi
elif command -v nvidia-smi &>/dev/null; then
  GPU_NAME=$(nvidia-smi --query-gpu=name --format=csv,noheader 2>/dev/null | head -1 | xargs)
  GPU_VRAM_MB=$(nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits 2>/dev/null | head -1 | xargs)
  GPU_VRAM="${GPU_VRAM_MB}MB"
  GPU_TYPE="nvidia"
fi

# Disk free
if [[ "$OS" == "Darwin" ]]; then
  DISK_FREE_GB=$(df -g / | awk 'NR==2{print $4}')
else
  DISK_FREE_GB=$(df -BG / | awk 'NR==2{gsub("G",""); print $4}')
fi

# Installed runtimes
INSTALLED=()
command -v ollama &>/dev/null && INSTALLED+=("ollama")
command -v lms &>/dev/null && INSTALLED+=("lm-studio")
command -v llama-cli &>/dev/null || command -v llama &>/dev/null && INSTALLED+=("llama.cpp")

INSTALLED_STR=$(IFS=', '; echo "${INSTALLED[*]}")
[[ -z "$INSTALLED_STR" ]] && INSTALLED_STR="none"

echo "=== Hardware Detection for LLM Selection ==="
echo "OS:                $OS ($ARCH)"
echo "CPU:               $CPU_MODEL ($CPU_CORES cores)"
echo "RAM:               ${TOTAL_RAM_GB}GB total"
echo "GPU:               $GPU_NAME"
echo "GPU Type:          $GPU_TYPE"
echo "GPU Memory:        $GPU_VRAM"
echo "Disk Free:         ${DISK_FREE_GB}GB"
echo "Installed runtimes: $INSTALLED_STR"
echo "============================================="
