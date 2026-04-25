import platform
import shutil
import subprocess
import psutil


def _get_gpu_info() -> dict:
    system = platform.system()
    gpu = {"name": None, "vram_gb": None, "type": None}

    if system == "Darwin":
        try:
            result = subprocess.run(
                ["system_profiler", "SPDisplaysDataType"],
                capture_output=True, text=True, timeout=5
            )
            for line in result.stdout.splitlines():
                line = line.strip()
                if "Chipset Model:" in line:
                    gpu["name"] = line.split(":", 1)[1].strip()
                    gpu["type"] = "apple_silicon" if "Apple" in gpu["name"] else "integrated"
                if "VRAM" in line and ":" in line:
                    val = line.split(":", 1)[1].strip().lower()
                    if "gb" in val:
                        try:
                            gpu["vram_gb"] = float(val.replace("gb", "").strip())
                        except ValueError:
                            pass
        except Exception:
            pass

    elif system in ("Linux", "Windows"):
        try:
            result = subprocess.run(
                ["nvidia-smi", "--query-gpu=name,memory.total", "--format=csv,noheader,nounits"],
                capture_output=True, text=True, timeout=5
            )
            if result.returncode == 0 and result.stdout.strip():
                parts = result.stdout.strip().split(",")
                gpu["name"] = parts[0].strip()
                gpu["vram_gb"] = round(int(parts[1].strip()) / 1024, 1)
                gpu["type"] = "nvidia"
        except Exception:
            pass

    return gpu


def _check_installed_runtimes() -> list[str]:
    runtimes = []
    for binary, label in [("ollama", "ollama"), ("lms", "lm-studio")]:
        if shutil.which(binary):
            runtimes.append(label)
    return runtimes


def get_system_info() -> dict:
    vm = psutil.virtual_memory()
    cpu_count = psutil.cpu_count(logical=False) or psutil.cpu_count()
    disk = shutil.disk_usage("/")

    return {
        "os": platform.system(),
        "os_version": platform.version(),
        "arch": platform.machine(),
        "cpu": {
            "model": platform.processor() or platform.machine(),
            "physical_cores": cpu_count,
            "logical_cores": psutil.cpu_count(logical=True),
        },
        "ram": {
            "total_gb": round(vm.total / (1024 ** 3), 1),
            "available_gb": round(vm.available / (1024 ** 3), 1),
        },
        "disk": {
            "total_gb": round(disk.total / (1024 ** 3), 1),
            "free_gb": round(disk.free / (1024 ** 3), 1),
        },
        "gpu": _get_gpu_info(),
        "installed_runtimes": _check_installed_runtimes(),
    }
