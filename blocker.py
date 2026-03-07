import atexit
import ctypes
import ctypes.wintypes
import os
import signal
import subprocess
import sys
import time

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

RULE_NAME = "Block_DBD_Dublin_eu-west-1"
IP_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "eu-west-1.txt")
DBD_EXE = (
    r"C:\Program Files (x86)\Steam\steamapps\common\Dead by Daylight"
    r"\DeadByDaylight\Binaries\Win64\DeadByDaylight-Win64-Shipping.exe"
)

# ---------------------------------------------------------------------------
# State
# ---------------------------------------------------------------------------

_rule_created = False
_cleanup_done = False

# Reference forte sur le handler console — doit rester en vie tant que le
# programme tourne (sinon le GC le collecte et SetConsoleCtrlHandler plante).
_console_handler_ref = None

# ---------------------------------------------------------------------------
# Admin check
# ---------------------------------------------------------------------------

def check_admin():
    if not ctypes.windll.shell32.IsUserAnAdmin():
        print("ERREUR : Ce programme doit etre lance en tant qu'administrateur.")
        print("Clic droit -> 'Executer en tant qu'administrateur'")
        input("\nAppuyez sur ENTREE pour quitter.")
        sys.exit(1)

# ---------------------------------------------------------------------------
# IP loading
# ---------------------------------------------------------------------------

def load_ipv4_cidrs(filepath: str) -> list[str]:
    if not os.path.exists(filepath):
        print(f"ERREUR : Fichier introuvable : {filepath}")
        input("Appuyez sur ENTREE pour quitter.")
        sys.exit(1)
    cidrs = []
    with open(filepath, "r") as f:
        for line in f:
            line = line.strip()
            if line and ":" not in line:  # ignorer lignes vides et IPv6
                cidrs.append(line)
    return cidrs

# ---------------------------------------------------------------------------
# PowerShell helper
# ---------------------------------------------------------------------------

def ps(command: str) -> tuple[bool, str, str]:
    """Lance une commande PowerShell. Retourne (succes, stdout, stderr)."""
    result = subprocess.run(
        [
            "powershell",
            "-NoProfile",
            "-NonInteractive",
            "-ExecutionPolicy", "Bypass",
            "-Command",
            command,
        ],
        capture_output=True,
        text=True,
    )
    ok = result.returncode == 0
    return ok, result.stdout.strip(), result.stderr.strip()

# ---------------------------------------------------------------------------
# Firewall operations
# ---------------------------------------------------------------------------

def rule_exists() -> bool:
    ok, out, _ = ps(
        f'Get-NetFirewallRule -DisplayName "{RULE_NAME}" -ErrorAction SilentlyContinue'
    )
    return ok and out != ""


def _remove_rule_once() -> bool:
    ok, _, err = ps(
        f'Remove-NetFirewallRule -DisplayName "{RULE_NAME}" -ErrorAction SilentlyContinue'
    )
    return ok


def block(cidrs: list[str]) -> bool:
    """Crée la règle en 2 étapes. Retourne True si succès."""
    global _rule_created

    # --- Étape 1/4 : nettoyage préventif ---
    print("[1/4] Nettoyage preventif...", end=" ", flush=True)
    if rule_exists():
        _remove_rule_once()
        if rule_exists():
            print("ECHEC — impossible de supprimer la règle residuelle.")
            print("        Lancez Unblock-DBD-Dublin.ps1 puis reessayez.")
            return False
        print("OK (règle residuelle supprimee)")
    else:
        print("OK (aucune règle residuelle)")

    # --- Étape 2/4 : création règle sans programme ---
    print("[2/4] Creation de la règle de base...", end=" ", flush=True)
    cidrs_str = ",".join(f'"{c}"' for c in cidrs)
    cmd_create = (
        f'New-NetFirewallRule '
        f'-DisplayName "{RULE_NAME}" '
        f'-Direction Outbound '
        f'-Action Block '
        f'-Protocol Any '
        f'-RemoteAddress @({cidrs_str}) '
        f'-Description "Blocks DBD connections to AWS eu-west-1 (Dublin)" '
        f'-Enabled True '
        f'-Profile Any '
        f'-ErrorAction Stop | Out-Null'
    )
    ok, _, err = ps(cmd_create)
    if not ok:
        print(f"ECHEC\n    Erreur : {err}")
        _remove_rule_once()  # rollback partiel
        return False
    print("OK")

    # --- Étape 3/4 : ajout filtre programme ---
    print("[3/4] Ajout du filtre programme...", end=" ", flush=True)
    cmd_program = (
        f'Get-NetFirewallRule -DisplayName "{RULE_NAME}" | '
        f'Get-NetFirewallApplicationFilter | '
        f'Set-NetFirewallApplicationFilter -Program "{DBD_EXE}" -ErrorAction Stop'
    )
    ok, _, err = ps(cmd_program)
    if not ok:
        print(f"ECHEC\n    Erreur : {err}")
        _remove_rule_once()  # rollback
        return False
    print(f"OK ({os.path.basename(DBD_EXE)})")

    # --- Étape 4/4 : vérification ---
    print("[4/4] Verification...", end=" ", flush=True)
    if not rule_exists():
        print("ECHEC — la règle n'est pas visible apres creation.")
        _remove_rule_once()
        return False
    print("OK — règle active")

    _rule_created = True
    return True


def unblock():
    """Supprime la règle. Retente 2 fois si nécessaire."""
    global _rule_created, _cleanup_done

    if _cleanup_done:
        return
    _cleanup_done = True

    if not _rule_created:
        return

    print("\n[1/2] Suppression de la règle...", end=" ", flush=True)

    for attempt in range(3):
        _remove_rule_once()
        if not rule_exists():
            break
        if attempt < 2:
            time.sleep(1)

    if rule_exists():
        print("ECHEC apres 3 tentatives.")
        print(f"    Supprimez manuellement : Unblock-DBD-Dublin.ps1")
        print(f"    Ou dans wf.msc : supprimer la règle '{RULE_NAME}'")
        return

    print("OK")
    print("[2/2] Verification...", end=" ", flush=True)
    print("OK — aucune règle active")
    print("\n  Blocage desactive. A bientot.")

# ---------------------------------------------------------------------------
# Exit handlers
# ---------------------------------------------------------------------------

def _signal_handler(sig, frame):
    sys.exit(0)  # déclenche atexit → unblock()


def _setup_console_ctrl_handler():
    global _console_handler_ref

    HandlerRoutine = ctypes.WINFUNCTYPE(ctypes.wintypes.BOOL, ctypes.wintypes.DWORD)

    def _ctrl_handler(event):
        # 2=CLOSE, 5=LOGOFF, 6=SHUTDOWN
        if event in (2, 5, 6):
            unblock()
        return False  # laisser le comportement par défaut (fermeture)

    _console_handler_ref = HandlerRoutine(_ctrl_handler)
    ctypes.windll.kernel32.SetConsoleCtrlHandler(_console_handler_ref, True)


def register_exit_handlers():
    atexit.register(unblock)
    signal.signal(signal.SIGINT, _signal_handler)
    signal.signal(signal.SIGTERM, _signal_handler)
    _setup_console_ctrl_handler()

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    check_admin()

    print("==========================================")
    print("  DBD Dublin Blocker -- Firewall Toggle")
    print("==========================================\n")

    cidrs = load_ipv4_cidrs(IP_FILE)
    print(f"  IPs chargees : {len(cidrs)} CIDRs IPv4 (IPv6 ignores)\n")

    register_exit_handlers()

    if not block(cidrs):
        print("\n  Echec du blocage. Aucune règle n'a ete creee.")
        input("  Appuyez sur ENTREE pour quitter.")
        sys.exit(1)

    print()
    print("  BLOCAGE ACTIF")
    print(f"  Programme : {os.path.basename(DBD_EXE)}")
    print(f"  IPs bloquees : {len(cidrs)} CIDRs eu-west-1")
    print()
    print("  Appuyez sur ENTREE pour desactiver et quitter.")
    print("  (Ctrl+C ou bouton X fonctionnent aussi)")
    print("  [!] Ne pas fermer via taskkill /F — la règle resterait active.\n")

    input()


if __name__ == "__main__":
    main()
