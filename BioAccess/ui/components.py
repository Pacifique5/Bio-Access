"""Shared UI widgets and styling helpers."""

import customtkinter as ctk

from config import PRIMARY_COLOR, SIDEBAR_COLOR


def create_sidebar_button(parent, text: str, command, row: int) -> ctk.CTkButton:
    return ctk.CTkButton(
        parent,
        text=text,
        command=command,
        anchor="w",
        height=40,
        fg_color="transparent",
        text_color="white",
        hover_color="#334155",
        font=ctk.CTkFont(size=14),
    )


def create_stat_card(parent, title: str, value: str, color: str = PRIMARY_COLOR) -> ctk.CTkFrame:
    frame = ctk.CTkFrame(parent, corner_radius=12, fg_color="#f8fafc")
    ctk.CTkLabel(
        frame,
        text=title,
        font=ctk.CTkFont(size=13),
        text_color="#64748b",
    ).pack(anchor="w", padx=16, pady=(14, 4))
    ctk.CTkLabel(
        frame,
        text=value,
        font=ctk.CTkFont(size=28, weight="bold"),
        text_color=color,
    ).pack(anchor="w", padx=16, pady=(0, 14))
    return frame


def show_message(parent, title: str, message: str, is_error: bool = False) -> None:
    dialog = ctk.CTkToplevel(parent)
    dialog.title(title)
    dialog.geometry("420x180")
    dialog.transient(parent)
    dialog.grab_set()

    color = "#dc2626" if is_error else "#16a34a"
    ctk.CTkLabel(
        dialog,
        text=message,
        wraplength=380,
        font=ctk.CTkFont(size=14),
        text_color=color,
    ).pack(expand=True, padx=20, pady=20)
    ctk.CTkButton(dialog, text="OK", command=dialog.destroy, width=100).pack(pady=(0, 16))
