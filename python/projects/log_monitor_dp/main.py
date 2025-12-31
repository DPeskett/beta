# monitor.py
import time
import os
import json
from datetime import datetime

# Import our modular components
from patterns import load_patterns, match_patterns
from alerts import send_alert


# ------------------------------------------------------------
# CONFIG LOADING
# ------------------------------------------------------------

def load_config(config_path="config.json"):
    """
    Load configuration from a JSON file.
    Falls back to defaults if something goes wrong.
    """
    default_config = {
        "log_file": "example.log",
        "check_interval": 0.5,
        "patterns": ["ERROR", "CRITICAL", "failed login"],
        "alert_method": "console",
        "email_settings": {
            "enabled": False,
            "smtp_server": "",
            "port": 587,
            "use_tls": True,
            "username": "",
            "password": "",
            "recipient": ""
        },
        "webhook_url": ""
    }

    try:
        with open(config_path, "r") as f:
            config_from_file = json.load(f)
        default_config.update(config_from_file)
        return default_config

    except FileNotFoundError:
        print(f"[WARN] Config file not found: {config_path}. Using defaults.")
        return default_config

    except json.JSONDecodeError as e:
        print(f"[WARN] Failed to parse config.json: {e}. Using defaults.")
        return default_config

    except Exception as e:
        print(f"[WARN] Unexpected error loading config: {e}. Using defaults.")
        return default_config


# ------------------------------------------------------------
# INTERNAL LOGGING (optional but professional)
# ------------------------------------------------------------

def internal_log(message, file_path="logs/monitor.log"):
    """
    Write internal events to a log file.
    This is separate from alert logs.
    """
    try:
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, "a") as f:
            f.write(f"[{datetime.now()}] {message}\n")
    except Exception:
        # Avoid recursive logging failures
        pass


# ------------------------------------------------------------
# CORE LOG MONITORING FUNCTION
# ------------------------------------------------------------

def monitor_log(config):
    """
    Continuously monitor a log file for new lines and detect patterns.
    Uses settings from the config dictionary.
    """

    log_file_path = config["log_file"]
    check_interval = config["check_interval"]

    # Load and compile patterns
    patterns = load_patterns(config["patterns"])

    internal_log(f"Monitoring started on {log_file_path}")

    try:
        with open(log_file_path, "r") as file:
            # Move to end of file (tail -f behavior)
            file.seek(0, os.SEEK_END)
            print(f"[INFO] Monitoring started on: {log_file_path}")

            while True:
                line = file.readline()

                if not line:
                    # No new data → sleep
                    time.sleep(check_interval)

                    # Detect log rotation (file truncated)
                    try:
                        if os.path.getsize(log_file_path) < file.tell():
                            internal_log("Log rotation detected. Reopening file.")
                            print("[INFO] Log rotation detected. Reopening file.")
                            file.close()
                            file = open(log_file_path, "r")
                            file.seek(0, os.SEEK_END)
                    except Exception:
                        pass

                    continue

                # Check for matches
                matches = match_patterns(patterns, line)
                for pattern in matches:
                    send_alert(config, pattern, line)

    except FileNotFoundError:
        print(f"[ERROR] Log file not found: {log_file_path}")
        internal_log(f"ERROR: Log file not found: {log_file_path}")

    except PermissionError:
        print(f"[ERROR] Permission denied when accessing: {log_file_path}")
        internal_log(f"ERROR: Permission denied: {log_file_path}")

    except KeyboardInterrupt:
        print("\n[INFO] Monitoring stopped by user.")
        internal_log("Monitoring stopped by user.")

    except Exception as e:
        print(f"[ERROR] Unexpected error: {e}")
        internal_log(f"Unexpected error: {e}")


# ------------------------------------------------------------
# ENTRY POINT
# ------------------------------------------------------------

if __name__ == "__main__":
    print("[INFO] Starting log monitor...")

    # Load config from config.json
    config = load_config()

    # Optional: print config for debugging
    print(f"[INFO] Using config: {config}")

    monitor_log(config)