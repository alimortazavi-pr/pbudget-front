# -*- coding: utf-8 -*-
"""Persian UI string translation engine for Paradise Budget i18n."""

from __future__ import annotations

import json
import re
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
EXTRACTED_PATH = SCRIPT_DIR / "i18n-extracted.json"

BRAND_FA = "میز پردیس"
BRAND_EN = "Paradise Budget"
BRAND_AR = "بارادايس بودجت"

MONTHS = {
    "فروردین": ("Farvardin", "فروردين"),
    "اردیبهشت": ("Ordibehesht", "أرديبهشت"),
    "خرداد": ("Khordad", "خرداد"),
    "تیر": ("Tir", "تير"),
    "مرداد": ("Mordad", "مرداد"),
    "شهریور": ("Shahrivar", "شهريور"),
    "مهر": ("Mehr", "مهر"),
    "آبان": ("Aban", "آبان"),
    "آذر": ("Azar", "آذر"),
    "دی": ("Dey", "دي"),
    "بهمن": ("Bahman", "بهمن"),
    "اسفند": ("Esfand", "إسفند"),
}

ARABIC_NAV = {
    "الأقساط": ("Installments", "الأقساط"),
    "الإعدادات": ("Settings", "الإعدادات"),
    "الالتزامات": ("Commitments", "الالتزامات"),
    "البرنامج اليومي": ("Daily schedule", "البرنامج اليومي"),
    "التخطيط": ("Planning", "التخطيط"),
    "التقارير": ("Reports", "التقارير"),
    "الديون": ("Debts", "الديون"),
    "الرئيسي": ("Main", "الرئيسي"),
    "الرئيسية": ("Home", "الرئيسية"),
    "الشراكة": ("Partnership", "الشراكة"),
    "الشركاء": ("Partners", "الشركاء"),
    "الشركاء والتسوية": ("Partners & settlement", "الشركاء والتسوية"),
    "الشيكات": ("Checks", "الشيكات"),
    "الصناديق": ("Funds", "الصناديق"),
    "العربية": ("Arabic", "العربية"),
    "الفئات": ("Categories", "الفئات"),
    "المالية المتقدمة": ("Advanced finance", "المالية المتقدمة"),
    "المزيد": ("More", "المزيد"),
    "المشاريع": ("Projects", "المشاريع"),
    "المكتب الشخصي": ("Personal desk", "المكتب الشخصي"),
    "الملف الشخصي": ("Profile", "الملف الشخصي"),
    "استيراد بنكي": ("Bank import", "استيراد بنكي"),
    "بطاقاتي": ("My cards", "بطاقاتي"),
    "تحليل مالي": ("Financial analysis", "تحليل مالي"),
    "تسجيل": ("Register", "تسجيل"),
    "تغيير الحساب": ("Switch account", "تغيير الحساب"),
    "تغيير المظهر": ("Change appearance", "تغيير المظهر"),
    "حضور العمل الحر": ("Freelance attendance", "حضور العمل الحر"),
    "سنوي": ("Annual", "سنوي"),
    "شهري": ("Monthly", "شهري"),
    "لوحة القيادة": ("Dashboard", "لوحة القيادة"),
    "مساعدة": ("Help", "مساعدة"),
    "نظرة عامة": ("Overview", "نظرة عامة"),
    "يومي": ("Daily", "يومي"),
}

# Full explicit translations for every extracted key.
# Generated with professional finance/budget UI language.
EXACT: dict[str, tuple[str, str]] = {}

def _load_triplets():
    try:
        from _translation_data import TRANSLATION_TRIPLETS
        for fa, en, ar in TRANSLATION_TRIPLETS:
            EXACT[fa] = (en, ar)
    except ImportError:
        pass

_load_triplets()
