"""Attendance operations that combine biometric verification with DB updates."""

from typing import Optional, Tuple

from authentication.windows_hello import WindowsHelloAuth
from services.activity_service import ActivityService
from services.attendance_service import AttendanceService
from services.user_service import UserService


class AttendanceManager:
    """
    High-level attendance flow:
    1. Resolve employee by ID
    2. Windows Hello verification (fingerprint / face / PIN)
    3. Record check-in or check-out
    """

    @staticmethod
    def verify_and_check_in(employee_id: str, admin_id: Optional[int] = None) -> Tuple[bool, str]:
        user = UserService.get_user_by_employee_id(employee_id)
        if not user:
            return False, f"Employee ID '{employee_id}' not found."

        verified, msg = WindowsHelloAuth.verify_user(
            f"Verify identity for check-in: {user.full_name}"
        )
        if not verified:
            ActivityService.log(
                f"Windows Hello check-in failed for {user.employee_id}: {msg}",
                user_id=user.id,
                admin_id=admin_id,
            )
            return False, msg

        success, result_msg = AttendanceService.check_in(user.id)
        if success:
            ActivityService.log(
                f"Check-in via Windows Hello: {user.full_name} ({user.employee_id})",
                user_id=user.id,
                admin_id=admin_id,
            )
        return success, result_msg

    @staticmethod
    def verify_and_check_out(employee_id: str, admin_id: Optional[int] = None) -> Tuple[bool, str]:
        user = UserService.get_user_by_employee_id(employee_id)
        if not user:
            return False, f"Employee ID '{employee_id}' not found."

        verified, msg = WindowsHelloAuth.verify_user(
            f"Verify identity for check-out: {user.full_name}"
        )
        if not verified:
            ActivityService.log(
                f"Windows Hello check-out failed for {user.employee_id}: {msg}",
                user_id=user.id,
                admin_id=admin_id,
            )
            return False, msg

        success, result_msg = AttendanceService.check_out(user.id)
        if success:
            ActivityService.log(
                f"Check-out via Windows Hello: {user.full_name} ({user.employee_id})",
                user_id=user.id,
                admin_id=admin_id,
            )
        return success, result_msg
