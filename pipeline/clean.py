"""
Aralite — Cleaning pipeline for DepEd SY 2023-2024 enrollment data.

Rule from the case study: ZERO DATA LOSS. We never drop rows or columns.
We only REPAIR values (encoding, whitespace, casing, invalid tokens) and
ADD standardized copies. Official values stay intact.

Run:  python pipeline/clean.py
In:   data/raw.xlsx  (sheet "DB", real header on row 5)
Out:  data/schools.parquet, data/enrollment.parquet, data/quality_report.md
"""

import re
import pandas as pd

RAW = "data/raw.xlsx"

# ---------------------------------------------------------------
# 1. LOAD — the first 4 rows are title text, not data. header=4
# points pandas at the real column names on row 5.
# ---------------------------------------------------------------
df = pd.read_excel(RAW, sheet_name="DB", header=4)
rows_in, cols_in = df.shape
print(f"Loaded {rows_in} rows x {cols_in} cols")

ID_COLS = list(df.columns[:14])      # school info
ENROLL_COLS = list(df.columns[14:])  # 58 numeric enrollment columns

# ---------------------------------------------------------------
# 2. FIX MOJIBAKE — "Ñ" saved as UTF-8 but read as Latin-1 becomes
# "Ã‘". We REVERSE the bad decode; deleting would corrupt names.
# ---------------------------------------------------------------
def fix_mojibake(text):
    if not isinstance(text, str):
        return text
    if "Ã" in text or "Â" in text:
        try:
            return text.encode("latin-1").decode("utf-8")
        except (UnicodeEncodeError, UnicodeDecodeError):
            return text
    return text

mojibake_before = sum(df[c].astype(str).str.contains("Ã", na=False).sum() for c in ID_COLS)
for c in ID_COLS:
    df[c] = df[c].map(fix_mojibake)
mojibake_after = sum(df[c].astype(str).str.contains("Ã", na=False).sum() for c in ID_COLS)

# ---------------------------------------------------------------
# 3. STRIP LEADING JUNK + NORMALIZE WHITESPACE
# Leading '-', '#', '*', '.' or quotes are data-entry noise that
# breaks sorting and search. Extra spaces make "Bacarra  I" and
# "Bacarra I" count as two different values in groupings.
# ---------------------------------------------------------------
def tidy(text):
    if not isinstance(text, str):
        return text
    text = re.sub(r"^[\-\#\*\.\'\"\s]+", "", text)   # strip leading junk
    return re.sub(r"\s+", " ", text).strip()          # squeeze spaces

junk_before = sum(df[c].astype(str).str.match(r"^[\-\#\*\.\'\"\s]+").sum() for c in ID_COLS)
for c in ID_COLS:
    df[c] = df[c].map(tidy)

# ---------------------------------------------------------------
# 4. STANDARDIZE CASING — geo columns arrive ALL CAPS; consistent
# casing matters because filters/joins are case-sensitive. School
# Name keeps its official casing.
# ---------------------------------------------------------------
SMALL_WORDS = {"of", "de", "del", "la", "las", "los", "y", "and", "the"}

def smart_title(text):
    if not isinstance(text, str):
        return text
    words = text.lower().split(" ")
    out = []
    for i, w in enumerate(words):
        if i > 0 and w in SMALL_WORDS:
            out.append(w)
        elif w.startswith("("):
            out.append("(" + w[1:].capitalize())
        else:
            out.append(w.capitalize())
    return " ".join(out)

for c in ["Province", "Municipality", "Barangay"]:
    df[c] = df[c].map(smart_title)

# ---------------------------------------------------------------
# 5. REPLACE INVALID / PLACEHOLDER VALUES — text like 'N/A', 'NA',
# 'NONE', '-', '*', '0' in TEXT columns is noise pretending to be
# data. We replace with an explicit, filterable label. (Enrollment
# NUMBERS are untouched — a 0 there is real information.)
# ---------------------------------------------------------------
INVALID = {"N/A", "NA", "N.A.", "N / A", "-", "*", "0", ".", "'", "NONE", "NULL", ""}
EMPTY_LABEL = "Not Provided"

invalid_fixed = 0
for c in ID_COLS:
    if pd.api.types.is_string_dtype(df[c]) or df[c].dtype == object:
        mask = df[c].astype(str).str.strip().str.upper().isin(INVALID) | df[c].isna()
        invalid_fixed += int(mask.sum())
        df.loc[mask, c] = EMPTY_LABEL

# ---------------------------------------------------------------
# 6. STANDARDIZE ABBREVIATIONS -> NEW COLUMN (zero data loss!)
# 'ES', 'Elem.', 'E/S' all mean Elementary School. We expand them in
# a NEW column "School Name Clean" so search and display are uniform
# while the official name stays exactly as DepEd recorded it.
# ---------------------------------------------------------------
ABBREV = [
    (r"\bE/S\b", "Elementary School"),
    (r"\bElem\.?\b", "Elementary School"),
    (r"\bES\b", "Elementary School"),
    (r"\bNHS\b", "National High School"),
    (r"\bCES\b", "Central Elementary School"),
    (r"\bCS\b", "Central School"),
    (r"\bP/S\b", "Primary School"),
    (r"\bPS\b", "Primary School"),
    (r"\bHS\b", "High School"),
    (r"\bLC\b", "Learning Center"),
    (r"\bSch\.\b", "School"),
    (r"\bMem\.\b", "Memorial"),
    (r"\bIncorporated\b", "Inc."),
]

def expand_name(name):
    if not isinstance(name, str):
        return name
    out = name
    for pat, repl in ABBREV:
        out = re.sub(pat, repl, out)
    return re.sub(r"\s+", " ", out).strip()

df["School Name Clean"] = df["School Name"].map(expand_name)
names_standardized = int((df["School Name Clean"] != df["School Name"]).sum())

# ---------------------------------------------------------------
# 7. VALIDATE ENROLLMENT NUMBERS — assert, don't silently fix.
# ---------------------------------------------------------------
assert df["BEIS School ID"].is_unique, "Duplicate school IDs found!"
for c in ENROLL_COLS:
    df[c] = pd.to_numeric(df[c], errors="raise")
assert (df[ENROLL_COLS] >= 0).all().all(), "Negative enrollment found!"
df["Total Enrollment"] = df[ENROLL_COLS].sum(axis=1)

# ---------------------------------------------------------------
# 8. RESHAPE WIDE -> LONG — one row per school/grade/strand/gender.
# ---------------------------------------------------------------
long = df.melt(
    id_vars=["BEIS School ID"], value_vars=ENROLL_COLS,
    var_name="col", value_name="enrollment",
)

def parse_col(col):
    gender = "Male" if col.endswith("Male") else "Female"
    rest = col[: -len(gender)].strip()
    parts = rest.split(" ", 1)
    grade = parts[0]
    strand = parts[1] if len(parts) > 1 else None
    if grade in ("Elem", "JHS"):
        grade, strand = rest, None
    return grade, strand

parsed = long["col"].map(parse_col)
long["grade"] = parsed.map(lambda t: t[0])
long["strand"] = parsed.map(lambda t: t[1])
long["gender"] = long["col"].str.endswith("Male").map({True: "Male", False: "Female"})
long = long.drop(columns=["col"])

# ---------------------------------------------------------------
# 9. EXPORT + QUALITY REPORT — proof, not "trust me".
# ---------------------------------------------------------------
schools = df[ID_COLS + ["School Name Clean", "Total Enrollment"]]
schools.to_parquet("data/schools.parquet", index=False)
long.to_parquet("data/enrollment.parquet", index=False)

report = f"""# Aralite Data Quality Report
Source: DepEd LIS, SY 2023-2024 (as of Jan 31, 2024)

| Check | Result |
|---|---|
| Rows in / out | {rows_in} / {len(schools)} (no rows dropped) |
| Enrollment cells in / out | {rows_in * len(ENROLL_COLS)} / {len(long)} (all preserved) |
| Mojibake cells repaired | {mojibake_before - mojibake_after} |
| Leading junk characters stripped | {junk_before} |
| Invalid/placeholder values labeled | {invalid_fixed} -> "{EMPTY_LABEL}" |
| School names standardized (new column) | {names_standardized} (originals kept) |
| Duplicate school IDs | 0 |
| Negative enrollments | 0 |
| Total enrollment (sum) | {int(df['Total Enrollment'].sum()):,} |
"""
with open("data/quality_report.md", "w") as f:
    f.write(report)
print(report)