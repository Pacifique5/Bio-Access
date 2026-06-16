export interface Admin {
  id: number;
  username: string;
  role: string;
}

export interface User {
  id: number;
  employee_id: string;
  full_name: string;
  department: string;
  email: string;
  phone: string | null;
  role: string;
  fingerprint_registered: boolean;
  created_at: string;
}

export interface AttendanceRecord {
  id: number;
  user_id: number;
  employee_id: string;
  full_name: string;
  department: string;
  check_in_time: string | null;
  check_out_time: string | null;
  work_hours: number | null;
  attendance_date: string;
}

export interface DashboardStats {
  total_users: number;
  present_today: number;
  absent_today: number;
  checkins_today: number;
}

export interface ActivityLog {
  id: number;
  action: string;
  timestamp: string;
  user_name?: string;
  admin_name?: string;
}
