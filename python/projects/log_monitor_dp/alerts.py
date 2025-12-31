# alerts.py
import os
from datetime import datetime
import smtplib
from email.mime.text import MIMEText
import json
import urllib.request

# ------------------------------------------------------------
# HELPER: Timestamp formatting
# ------------------------------------------------------------

def timestamp():
    """Return a formatted timestamp string."""
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


# ------------------------------------------------------------
# CONSOLE ALERT
# ------------------------------------------------------------

def alert_console(pattern, line):
    """
    Print an alert to the console.
    """
    print(f"[ALERT] {timestamp()} | Pattern '{pattern}' matched:")
    print(f"        {line.strip()}")


# ------------------------------------------------------------
# FILE ALERT
# ------------------------------------------------------------

def alert_file(pattern, line, file_path="logs/monitor.log"):
    """
    Append alerts to a file for long-term storage.
    Creates the logs directory if needed.
    """
    try:
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, "a") as f:
            f.write(f"{timestamp()} | Pattern '{pattern}' | {line}")
    except Exception as e:
        print(f"[WARN] Failed to write alert to file: {e}")


# ------------------------------------------------------------
# EMAIL ALERT (stub)
# ------------------------------------------------------------

def alert_email(config, pattern, line):
    """
    Send an email alert using SMTP.
    This is a safe stub — no credentials stored in code.
    """
    email_cfg = config.get("email_settings", {})
    if not email_cfg.get("enabled", False):
        print("[WARN] Email alert attempted but email is disabled in config.")
        return

    try:
        msg = MIMEText(f"Pattern '{pattern}' matched:\n\n{line}")
        msg["Subject"] = f"Log Alert: {pattern}"
        msg["From"] = email_cfg["username"]
        msg["To"] = email_cfg["recipient"]

        with smtplib.SMTP(email_cfg["smtp_server"], email_cfg["port"]) as server:
            if email_cfg.get("use_tls", True):
                server.starttls()
            server.login(email_cfg["username"], email_cfg["password"])
            server.send_message(msg)

        print(f"[INFO] Email alert sent for pattern '{pattern}'")

    except Exception as e:
        print(f"[ERROR] Failed to send email alert: {e}")


# ------------------------------------------------------------
# WEBHOOK ALERT (stub)
# ------------------------------------------------------------

def alert_webhook(config, pattern, line):
    """
    Send an alert to a webhook (Discord, Slack, etc.)
    """
    url = config.get("webhook_url", None)
    if not url:
        print("[WARN] Webhook alert attempted but no URL provided.")
        return

    payload = json.dumps({
        "content": f"[{timestamp()}] Pattern '{pattern}' matched:\n{line}"
    }).encode("utf-8")

    try:
        req = urllib.request.Request(
            url,
            data=payload,
            headers={"Content-Type": "application/json"}
        )
        urllib.request.urlopen(req)
        print(f"[INFO] Webhook alert sent for pattern '{pattern}'")
    except Exception as e:
        print(f"[ERROR] Failed to send webhook alert: {e}")


# ------------------------------------------------------------
# MAIN DISPATCH FUNCTION
# ------------------------------------------------------------

def send_alert(config, pattern, line):
    """
    Dispatch alert based on config settings.
    Supported: console, file, email, webhook
    """
    method = config.get("alert_method", "console")

    if method == "console":
        alert_console(pattern, line)

    elif method == "file":
        alert_file(pattern, line)

    elif method == "email":
        alert_email(config, pattern, line)

    elif method == "webhook":
        alert_webhook(config, pattern, line)

    else:
        print(f"[WARN] Unknown alert method '{method}'. Using console.")
        alert_console(pattern, line)