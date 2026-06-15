"""User management page – CRUD and search."""

import customtkinter as ctk
from tkinter import messagebox

from config import PRIMARY_COLOR
from services.user_service import UserService
from services.activity_service import ActivityService


class UsersFrame(ctk.CTkFrame):
    """Register, edit, delete, and search employees."""

    def __init__(self, master, admin=None, **kwargs):
        super().__init__(master, fg_color="transparent", **kwargs)
        self.admin = admin
        self.selected_user_id = None
        self._build_layout()
        self.refresh_table()

    def _build_layout(self):
        header = ctk.CTkFrame(self, fg_color="transparent")
        header.pack(fill="x", padx=24, pady=(24, 12))
        ctk.CTkLabel(header, text="User Management", font=ctk.CTkFont(size=28, weight="bold")).pack(
            side="left"
        )

        body = ctk.CTkFrame(self, fg_color="transparent")
        body.pack(fill="both", expand=True, padx=24, pady=12)

        form = ctk.CTkFrame(body, corner_radius=12, width=340)
        form.pack(side="left", fill="y", padx=(0, 12))
        form.pack_propagate(False)

        ctk.CTkLabel(form, text="Employee Details", font=ctk.CTkFont(size=16, weight="bold")).pack(
            anchor="w", padx=16, pady=(16, 12)
        )

        self.emp_id_label = ctk.CTkLabel(form, text="ID: (auto-generated)", text_color="gray")
        self.emp_id_label.pack(anchor="w", padx=16)

        self.name_entry = self._field(form, "Full Name")
        self.dept_entry = self._field(form, "Department")
        self.email_entry = self._field(form, "Email")
        self.phone_entry = self._field(form, "Phone")
        self.role_menu = ctk.CTkOptionMenu(
            form, values=["employee", "manager", "student"], width=280
        )
        ctk.CTkLabel(form, text="Role").pack(anchor="w", padx=16, pady=(8, 0))
        self.role_menu.pack(padx=16, pady=4)

        btn_row = ctk.CTkFrame(form, fg_color="transparent")
        btn_row.pack(fill="x", padx=16, pady=16)
        ctk.CTkButton(btn_row, text="Save", fg_color=PRIMARY_COLOR, command=self._save).pack(
            side="left", padx=4
        )
        ctk.CTkButton(btn_row, text="Clear", command=self._clear_form).pack(side="left", padx=4)
        ctk.CTkButton(btn_row, text="Delete", fg_color="#ef4444", command=self._delete).pack(
            side="left", padx=4
        )

        table_panel = ctk.CTkFrame(body, corner_radius=12)
        table_panel.pack(side="right", fill="both", expand=True)

        search_row = ctk.CTkFrame(table_panel, fg_color="transparent")
        search_row.pack(fill="x", padx=12, pady=12)
        self.search_entry = ctk.CTkEntry(search_row, placeholder_text="Search users...", width=260)
        self.search_entry.pack(side="left", padx=4)
        ctk.CTkButton(search_row, text="Search", command=self._search).pack(side="left", padx=4)
        ctk.CTkButton(search_row, text="Show All", command=self.refresh_table).pack(side="left", padx=4)

        self.table = ctk.CTkTextbox(table_panel)
        self.table.pack(fill="both", expand=True, padx=12, pady=(0, 12))
        self.table.configure(state="disabled")

    def _field(self, parent, label):
        ctk.CTkLabel(parent, text=label).pack(anchor="w", padx=16, pady=(8, 0))
        entry = ctk.CTkEntry(parent, width=280)
        entry.pack(padx=16, pady=4)
        return entry

    def refresh_table(self):
        users = UserService.get_all_users()
        self._populate_table(users)

    def _search(self):
        query = self.search_entry.get()
        users = UserService.search_users(query) if query else UserService.get_all_users()
        self._populate_table(users)

    def _populate_table(self, users):
        self.table.configure(state="normal")
        self.table.delete("1.0", "end")
        header = f"{'ID':<14} {'Name':<22} {'Department':<16} {'Email':<26} {'Role'}\n"
        self.table.insert("end", header)
        self.table.insert("end", "-" * 90 + "\n")
        for u in users:
            line = (
                f"{u.employee_id:<14} {u.full_name[:20]:<22} {u.department[:14]:<16} "
                f"{u.email[:24]:<26} {u.role}\n"
            )
            self.table.insert("end", line)
        self.table.configure(state="disabled")
        self._user_map = {u.employee_id: u for u in users}

        self.table.bind("<Button-1>", self._on_row_click)

    def _on_row_click(self, event=None):
        try:
            index = self.table.index(f"@{event.x},{event.y}")
            line = self.table.get(f"{index} linestart", f"{index} lineend").strip()
            if not line or line.startswith("-") or line.startswith("ID"):
                return
            emp_id = line.split()[0]
            user = self._user_map.get(emp_id)
            if user:
                self.selected_user_id = user.id
                self.emp_id_label.configure(text=f"ID: {user.employee_id}")
                self.name_entry.delete(0, "end")
                self.name_entry.insert(0, user.full_name)
                self.dept_entry.delete(0, "end")
                self.dept_entry.insert(0, user.department)
                self.email_entry.delete(0, "end")
                self.email_entry.insert(0, user.email)
                self.phone_entry.delete(0, "end")
                self.phone_entry.insert(0, user.phone)
                self.role_menu.set(user.role)
        except Exception:
            pass

    def _clear_form(self):
        self.selected_user_id = None
        self.emp_id_label.configure(text="ID: (auto-generated)")
        for entry in (self.name_entry, self.dept_entry, self.email_entry, self.phone_entry):
            entry.delete(0, "end")
        self.role_menu.set("employee")

    def _save(self):
        try:
            if self.selected_user_id:
                user = UserService.update_user(
                    self.selected_user_id,
                    self.name_entry.get(),
                    self.dept_entry.get(),
                    self.email_entry.get(),
                    self.phone_entry.get(),
                    self.role_menu.get(),
                )
                ActivityService.log(
                    f"Updated user {user.employee_id}",
                    user_id=user.id,
                    admin_id=self.admin.id if self.admin else None,
                )
                messagebox.showinfo("Success", f"Updated {user.full_name}")
            else:
                user = UserService.create_user(
                    self.name_entry.get(),
                    self.dept_entry.get(),
                    self.email_entry.get(),
                    self.phone_entry.get(),
                    self.role_menu.get(),
                )
                ActivityService.log(
                    f"Registered user {user.employee_id}",
                    user_id=user.id,
                    admin_id=self.admin.id if self.admin else None,
                )
                messagebox.showinfo("Success", f"Registered {user.full_name}\nID: {user.employee_id}")
            self._clear_form()
            self.refresh_table()
        except ValueError as exc:
            messagebox.showerror("Validation Error", str(exc))
        except Exception as exc:
            messagebox.showerror("Error", str(exc))

    def _delete(self):
        if not self.selected_user_id:
            messagebox.showwarning("Warning", "Select a user from the table first.")
            return
        if messagebox.askyesno("Confirm", "Delete this user?"):
            UserService.delete_user(self.selected_user_id)
            ActivityService.log(
                f"Deleted user id={self.selected_user_id}",
                admin_id=self.admin.id if self.admin else None,
            )
            self._clear_form()
            self.refresh_table()
