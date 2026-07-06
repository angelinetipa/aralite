"""
Aralite — Step 1: Cleaning pipeline for DepEd SY 2023-2024 enrollment data.

Rule from the case study: ZERO DATA LOSS. We never drop rows or columns.
We only REPAIR values (fix encoding, whitespace, casing) and RESHAPE.

Run:  python pipeline/clean.py
In:   data/raw.xlsx  (sheet "DB", real header is on row 5)
Out:  data/schools.parquet      (1 row per school, wide format)
      data/enrollment.parquet   (long format: school x grade x gender)
      data/quality_report.md    (proof the cleaning is honest)
"""

import re
import pandas as pd

RAW = "data/raw.xlsx"

# ---------------------------------------------------------------
# 1. LOAD
# The first 4 rows of the sheet are title text ("SCHOOL LEVEL DATA...",
# "SY 2023-2024", ...), not data. header=4 tells pandas the real
# column names live on the 5th row. Loading wrong headers is the #1
# beginner mistake — everything downstream breaks silently.
# ---------------------------------------------------------------
df = pd.read_excel(RAW, sheet_name="DB", header=4)
rows_in, cols_in = df.shape
print(f"Loaded {rows_in} rows x {cols_in} cols")

ID_COLS = list(df.columns[:14])      # school info (Region ... Modified COC)
ENROLL_COLS = list(df.columns[14:])  # the 58 numeric enrollment columns

# ---------------------------------------------------------------
# 2. FIX MOJIBAKE (the "~ letters" problem)
# What happened: text was saved as UTF-8 but later read as Latin-1,
# so "Ñ" became "Ã‘" (e.g. SABAÑGAN -> SABAÃ‘GAN). This is called
# mojibake. The CORRECT fix is to reverse the bad decode — encode
# back to latin-1 bytes, then decode as UTF-8. Deleting the weird
# characters would corrupt real place names (zero-data-loss rule!).
# ---------------------------------------------------------------
def fix_mojibake(text):
    if not isinstance(text, str):
        return text
    if "Ã" in text or "Â" in text:          # cheap check before the costly round-trip
        try:
            repaired = text.encode("latin-1").decode("utf-8")
            return repaired
        except (UnicodeEncodeError, UnicodeDecodeError):
            return text                       # not mojibake — leave untouched
    return text

mojibake_before = sum(df[c].astype(str).str.contains("Ã", na=False).sum() for c in ID_COLS)
for c in ID_COLS:
    df[c] = df[c].map(fix_mojibake)
mojibake_after = sum(df[c].astype(str).str.contains("Ã", na=False).sum() for c in ID_COLS)
print(f"Mojibake cells repaired: {mojibake_before - mojibake_after}")

# ---------------------------------------------------------------
# 3. NORMALIZE WHITESPACE
# Extra spaces make "Bacarra I" and "Bacarra  I" count as two different
# districts in a groupby — silently wrong aggregates. We strip edges and
# collapse repeated spaces. This changes formatting only, never meaning.
# ---------------------------------------------------------------
def squeeze_ws(text):
    if not isinstance(text, str):
        return text
    return re.sub(r"\s+", " ", text).strip()

for c in ID_COLS:
    df[c] = df[c].map(squeeze_ws)

# ---------------------------------------------------------------
# 4. STANDARDIZE CASING (the "capital or not" problem)
# The file mixes styles: School Name is Title Case, but Municipality /
# Barangay / Province are ALL CAPS. Consistent casing matters because
# filters and joins are case-sensitive ("Bacarra" != "BACARRA").
# We title-case the ALL-CAPS geo columns, but protect small words
# (of, de, del...) and keep things like "(POB.)" readable.
# We do NOT touch School Name — it already has intentional casing
# (e.g. "Doña Josefa E. Marcos ES") that naive .title() would break.
# ---------------------------------------------------------------
SMALL_WORDS = {"of", "de", "del", "la", "las", "los", "y", "and", "the"}

def smart_title(text):
    if not isinstance(text, str):
        return text
    words = text.lower().split(" ")
    out = []
    for i, w in enumerate(words):
        if i > 0 and w in SMALL_WORDS:
            out.append(w)                              # keep "City of Muñoz" not "City Of Muñoz"
        elif w.startswith("("):                        # "(pob.)" -> "(Pob.)"
            out.append("(" + w[1:].capitalize())
        else:
            out.append(w.capitalize())
    return " ".join(out)

for c in ["Province", "Municipality", "Barangay"]:
    df[c] = df[c].map(smart_title)

# ---------------------------------------------------------------
# 5. HANDLE MISSING VALUES — WITHOUT DELETING
# Only Street Address (1,682) and Barangay (70) have nulls. These are
# descriptive fields, not analysis keys, so we fill with an explicit
# "Not Provided" label instead of dropping rows. Explicit beats empty:
# a filter can now show these schools honestly.
# ---------------------------------------------------------------
null_report = df[["Street Address", "Barangay"]].isna().sum().to_dict()
df["Street Address"] = df["Street Address"].fillna("Not Provided")
df["Barangay"] = df["Barangay"].fillna("Not Provided")

# ---------------------------------------------------------------
# 6. VALIDATE ENROLLMENT NUMBERS
# We assert (not silently fix) the numeric health of the data:
# all enrollment cols numeric, no negatives, school IDs unique.
# If a future dataset breaks these rules, the pipeline should FAIL
# loudly instead of publishing wrong numbers.
# ---------------------------------------------------------------
assert df["BEIS School ID"].is_unique, "Duplicate school IDs found!"
for c in ENROLL_COLS:
    df[c] = pd.to_numeric(df[c], errors="raise")      # raise = crash on bad values, on purpose
assert (df[ENROLL_COLS] >= 0).all().all(), "Negative enrollment found!"
df["Total Enrollment"] = df[ENROLL_COLS].sum(axis=1)

# ---------------------------------------------------------------
# 7. RESHAPE: WIDE -> LONG
# 58 columns like "G7 Male" are hard to query. Long format gives one
# row per (school, grade, strand, gender, count) — the shape SQL and
# chart libraries want. pd.melt does this; then we split the column
# name into its parts. This is transformation, not deletion: every
# number survives, just re-arranged.
# ---------------------------------------------------------------
long = df.melt(
    id_vars=["BEIS School ID"],
    value_vars=ENROLL_COLS,
    var_name="col",
    value_name="enrollment",
)

def parse_col(col):
    """'G11 ACAD STEM Male' -> grade=G11, strand=ACAD STEM, gender=Male"""
    gender = "Male" if col.endswith("Male") else "Female"
    rest = col[: -len(gender)].strip()
    parts = rest.split(" ", 1)
    grade = parts[0]                                   # K, G1..G12, Elem, JHS
    strand = parts[1] if len(parts) > 1 else None      # NG, ACAD STEM, TVL...
    if grade in ("Elem", "JHS"):                       # "Elem NG" / "JHS NG" = non-graded
        grade, strand = rest, None
    return grade, strand

parsed = long["col"].map(parse_col)
long["grade"] = parsed.map(lambda t: t[0])
long["strand"] = parsed.map(lambda t: t[1])
long["gender"] = long["col"].str.endswith("Male").map({True: "Male", False: "Female"})
long = long.drop(columns=["col"])

# Keep zero rows? Yes — a school offering G11 STEM with 0 enrollees is
# real information (zero-data-loss). Filtering is the dashboard's job.

# ---------------------------------------------------------------
# 8. EXPORT TO PARQUET
# Parquet is columnar + compressed: our 30MB Excel becomes a few MB and
# loads 10-50x faster. It also stores real dtypes, so numbers stay
# numbers. This is the standard hand-off format in data engineering.
# ---------------------------------------------------------------
schools = df[ID_COLS + ["Total Enrollment"]]
schools.to_parquet("data/schools.parquet", index=False)
long.to_parquet("data/enrollment.parquet", index=False)

# ---------------------------------------------------------------
# 9. QUALITY REPORT — proof of honest cleaning
# A data engineer never says "trust me". The report shows counts in vs
# out, what was repaired, and confirms nothing was dropped.
# ---------------------------------------------------------------
report = f"""# Aralite Data Quality Report
Source: DepEd LIS, SY 2023-2024 (as of Jan 31, 2024)

| Check | Result |
|---|---|
| Rows in / out | {rows_in} / {len(schools)} (no rows dropped) |
| Enrollment cells in / out | {rows_in * len(ENROLL_COLS)} / {len(long)} (all preserved) |
| Mojibake cells repaired | {mojibake_before - mojibake_after} (e.g. SABAÃ‘GAN -> Sabañgan) |
| Nulls filled (Street Address) | {null_report['Street Address']} -> "Not Provided" |
| Nulls filled (Barangay) | {null_report['Barangay']} -> "Not Provided" |
| Duplicate school IDs | 0 |
| Negative enrollments | 0 |
| Total enrollment (sum) | {int(df['Total Enrollment'].sum()):,} |
"""
with open("data/quality_report.md", "w") as f:
    f.write(report)
print(report)