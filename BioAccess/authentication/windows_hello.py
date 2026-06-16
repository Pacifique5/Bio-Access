"""
Windows Hello biometric authentication via UserConsentVerifier.

Supports fingerprint, face recognition, and PIN through the OS prompt.
Uses PowerShell WinRT interop (reliable on desktop) with optional winsdk fallback.
"""

import asyncio
import subprocess
from typing import Tuple

AVAILABILITY_MESSAGES = {
    "available": "Windows Hello is available on this device.",
    "not_present": "No biometric device detected. Set up Windows Hello in Settings.",
    "not_configured": "Windows Hello is not configured. Add a fingerprint, face, or PIN.",
    "disabled_by_policy": "Biometric authentication is disabled by system policy.",
    "device_busy": "Biometric device is busy. Try again shortly.",
}

_PS_WINRT_HEADER = r"""
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
    $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and
    $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
})[0]
Function Await($WinRtTask, $ResultType) {
    $asTask = $asTaskGeneric.MakeGenericMethod($ResultType)
    $netTask = $asTask.Invoke($null, @($WinRtTask))
    $netTask.Wait(-1) | Out-Null
    $netTask.Result
}
[Windows.Security.Credentials.UI.UserConsentVerifier, Windows.Security.Credentials.UI, ContentType=WindowsRuntime] | Out-Null
"""

_PS_CHECK = _PS_WINRT_HEADER + r"""
$avail = Await ([Windows.Security.Credentials.UI.UserConsentVerifier]::CheckAvailabilityAsync()) ([Windows.Security.Credentials.UI.UserConsentVerifierAvailability])
Write-Output $avail.ToString()
"""


class WindowsHelloAuth:
    """Wrapper around Windows Hello UserConsentVerifier."""

    @staticmethod
    def _run_powershell(script: str) -> Tuple[bool, str]:
        try:
            proc = subprocess.run(
                ["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script],
                capture_output=True,
                text=True,
                timeout=120,
            )
            output = (proc.stdout or "").strip()
            if proc.returncode != 0:
                err = (proc.stderr or proc.stdout or "PowerShell error").strip()
                return False, err
            return True, output
        except subprocess.TimeoutExpired:
            return False, "Verification timed out."
        except Exception as exc:
            return False, str(exc)

    @staticmethod
    def _run_async(coro):
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as pool:
                    return pool.submit(asyncio.run, coro).result()
            return loop.run_until_complete(coro)
        except RuntimeError:
            return asyncio.run(coro)

    @staticmethod
    def _parse_availability(status: str) -> Tuple[bool, str]:
        status_lower = status.lower()
        if status_lower == "available":
            return True, AVAILABILITY_MESSAGES["available"]
        for key in ("notconfiguredforuser", "notconfigured"):
            if key in status_lower.replace("_", ""):
                return False, AVAILABILITY_MESSAGES["not_configured"]
        for key, msg in (
            ("notpresent", "not_present"),
            ("devicenotpresent", "not_present"),
            ("disabledbypolicy", "disabled_by_policy"),
            ("devicebusy", "device_busy"),
        ):
            if key in status_lower.replace("_", ""):
                return False, AVAILABILITY_MESSAGES[msg]
        return False, f"Windows Hello status: {status}"

    @staticmethod
    def _parse_verification(result: str) -> Tuple[bool, str]:
        result_lower = result.lower()
        if result_lower == "verified":
            return True, "Identity verified successfully via Windows Hello."
        if "cancel" in result_lower:
            return False, "Verification cancelled."
        if "retriesexhausted" in result_lower.replace("_", ""):
            return False, "Too many failed attempts. Try again later."
        return False, f"Verification failed: {result}"

    @staticmethod
    def _build_verify_script(message: str) -> str:
        safe_msg = message.replace("'", "''")
        return _PS_WINRT_HEADER + f"""
$result = Await ([Windows.Security.Credentials.UI.UserConsentVerifier]::RequestVerificationAsync('{safe_msg}')) ([Windows.Security.Credentials.UI.UserConsentVerificationResult])
Write-Output $result.ToString()
"""

    @staticmethod
    def check_availability() -> Tuple[bool, str]:
        ok, output = WindowsHelloAuth._run_powershell(_PS_CHECK)
        if ok and output:
            return WindowsHelloAuth._parse_availability(output)

        try:
            from winsdk.windows.security.credentials.ui import UserConsentVerifier

            async def _check():
                return str(await UserConsentVerifier.check_availability_async())

            return WindowsHelloAuth._parse_availability(
                WindowsHelloAuth._run_async(_check())
            )
        except ImportError:
            return False, output or "Could not access Windows Hello. Ensure it is set up in Windows Settings."
        except Exception as exc:
            return False, f"Could not check Windows Hello: {exc}"

    @staticmethod
    def verify_user(message: str = "Verify your identity to record attendance") -> Tuple[bool, str]:
        available, avail_msg = WindowsHelloAuth.check_availability()
        if not available:
            return False, avail_msg

        ok, output = WindowsHelloAuth._run_powershell(
            WindowsHelloAuth._build_verify_script(message)
        )
        if ok and output:
            return WindowsHelloAuth._parse_verification(output)

        try:
            from winsdk.windows.security.credentials.ui import UserConsentVerifier

            async def _verify():
                return str(await UserConsentVerifier.request_verification_async(message))

            return WindowsHelloAuth._parse_verification(
                WindowsHelloAuth._run_async(_verify())
            )
        except ImportError:
            return False, output or "Windows Hello verification failed."
        except Exception as exc:
            return False, f"Windows Hello error: {exc}"
