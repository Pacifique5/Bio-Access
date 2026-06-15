"""Excel export using openpyxl via pandas."""

import os
from datetime import datetime

import pandas as pd

from config import EXPORTS_DIR


def export_to_excel(df: pd.DataFrame, report_name: str) -> str:
    """Save DataFrame to exports/ and return the file path."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{report_name}_{timestamp}.xlsx"
    filepath = os.path.join(EXPORTS_DIR, filename)
    df.to_excel(filepath, index=False, engine="openpyxl")
    return filepath
