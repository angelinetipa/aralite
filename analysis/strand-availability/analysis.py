"""
analysis/strand-availability/analysis.py

Question: Does senior-high strand enrollment reflect what learners want,
or what their school happens to offer?

Source: DepEd Learner Information System, SY 2023-2024 (as of 31 Jan 2024).
Grain:  one row per school (schools.parquet), one row per
        school x grade x strand x gender (enrollment.parquet).

Run from the repo root:  python analysis/strand-availability/analysis.py
"""

from pathlib import Path
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent
CHARTS = OUT / "charts"
CHARTS.mkdir(parents=True, exist_ok=True)

INK, MUTED, ACCENT, ALERT = "#1b1f2a", "#c3c9d6", "#2f6fd0", "#c8452f"
SHS_COC = {"JHS with SHS", "All Offering", "Purely SHS"}
SHS_GRADES = ["G11", "G12"]

# Readable strand labels. The raw file mixes two separators
# ("ACAD - ABM" but "ACAD STEM"), which would otherwise show up in charts.
STRAND_LABEL = {
    "ACAD - ABM": "ABM", "ACAD - HUMSS": "HUMSS", "ACAD GAS": "GAS",
    "ACAD PBM": "PBM", "ACAD STEM": "STEM",
    "TVL": "TVL", "ARTS": "Arts & Design", "SPORTS": "Sports",
}


def check(label, condition, detail=""):
    """Assert a validation check and print the result. Fails loudly."""
    status = "PASS" if condition else "FAIL"
    print(f"  [{status}] {label}{' — ' + detail if detail else ''}")
    assert condition, f"Validation failed: {label} {detail}"


def main():
    print("Loading...")
    schools = pd.read_parquet(ROOT / "data" / "schools.parquet")
    enrol = pd.read_parquet(ROOT / "data" / "enrollment.parquet")

    # ---- Senior-high slice -------------------------------------------
    shs = (
        enrol[enrol.grade.isin(SHS_GRADES) & (enrol.enrollment > 0) & enrol.strand.notna()]
        .merge(schools[["BEIS School ID", "Region", "Sector", "Modified COC"]],
               on="BEIS School ID", how="left")
    )
    shs["strand_label"] = shs.strand.map(STRAND_LABEL)

    national_shs = int(shs.enrollment.sum())
    active = shs["BEIS School ID"].nunique()

    # ---- Validation ---------------------------------------------------
    # Every check here exists because a wrong number would otherwise reach
    # a reader who has no way to catch it.
    print("\nValidation")

    check("No unmapped strand labels", shs.strand_label.notna().all(),
          f"unmapped: {sorted(shs.loc[shs.strand_label.isna(), 'strand'].unique())}")

    check("No null regions after join", shs.Region.notna().all())

    by_region_total = shs.groupby("Region").enrollment.sum().sum()
    check("Regional totals sum to national", int(by_region_total) == national_shs,
          f"{int(by_region_total):,} vs {national_shs:,}")

    by_strand_total = shs.groupby("strand_label").enrollment.sum().sum()
    check("Strand totals sum to national", int(by_strand_total) == national_shs,
          f"{int(by_strand_total):,} vs {national_shs:,}")

    # Schools DepEd classifies as SHS-offering, vs schools with SHS enrollment.
    # The gap matters: it is the size of the assumption this analysis makes.
    classified = schools[schools["Modified COC"].isin(SHS_COC)]["BEIS School ID"].nunique()
    silent = classified - active
    check("Active SHS schools do not exceed classified SHS schools", active <= classified,
          f"{active:,} active / {classified:,} classified — {silent:,} with zero SHS enrollment")

    # ---- Supply: how many strands does each school actually run? -------
    per_school = (
        shs.groupby(["Region", "BEIS School ID"])["strand_label"].nunique()
        .rename("strands").reset_index()
    )
    learners_per_school = shs.groupby("BEIS School ID").enrollment.sum().rename("learners")
    per_school = per_school.merge(learners_per_school, on="BEIS School ID")

    check("Every school runs at least one strand", (per_school.strands >= 1).all())
    check("No school runs more than 8 strands", (per_school.strands <= 8).all())
    check("Per-school learner total matches national",
          int(per_school.learners.sum()) == national_shs)

    nat_avg = per_school.strands.mean()
    nat_one = (per_school.strands == 1).mean() * 100
    nat_learners_one = per_school.loc[per_school.strands == 1, "learners"].sum() / national_shs * 100

    region = per_school.groupby("Region").agg(
        schools=("BEIS School ID", "nunique"),
        avg_strands=("strands", "mean"),
        learners=("learners", "sum"),
    )
    region["pct_schools_one_strand"] = (
        per_school[per_school.strands == 1].groupby("Region").size() / region.schools * 100
    ).fillna(0)
    region["pct_learners_one_strand"] = (
        per_school[per_school.strands == 1].groupby("Region").learners.sum() / region.learners * 100
    ).fillna(0)
    region = region.round(2).sort_values("avg_strands")

    check("Regional school counts sum to national",
          int(region.schools.sum()) == active)

    # ---- Availability vs enrollment share, per strand ------------------
    avail = shs.groupby("strand_label")["BEIS School ID"].nunique() / active * 100
    share = shs.groupby("strand_label").enrollment.sum() / national_shs * 100
    per_offering = (
        shs.groupby("strand_label").enrollment.sum()
        / shs.groupby("strand_label")["BEIS School ID"].nunique()
    )
    strand_tbl = pd.DataFrame({
        "pct_schools_offering": avail.round(1),
        "pct_of_enrollment": share.round(1),
        "avg_learners_per_offering_school": per_offering.round(0),
    }).sort_values("pct_of_enrollment", ascending=False)

    check("Enrollment shares sum to 100%", abs(strand_tbl.pct_of_enrollment.sum() - 100) < 0.5,
          f"{strand_tbl.pct_of_enrollment.sum():.1f}%")

    # ---- STEM availability by sector -----------------------------------
    stem_schools = shs[shs.strand_label == "STEM"].groupby("Sector")["BEIS School ID"].nunique()
    all_schools = shs.groupby("Sector")["BEIS School ID"].nunique()
    sector_tbl = pd.DataFrame({
        "shs_schools": all_schools,
        "offering_stem": stem_schools,
        "pct_offering_stem": (stem_schools / all_schools * 100).round(1),
    }).sort_values("pct_offering_stem", ascending=False)

    # Hand-check: recompute one region from scratch, a different way.
    caraga = shs[shs.Region == "CARAGA"]
    manual = caraga.groupby("BEIS School ID").strand_label.nunique()
    check("Hand-check CARAGA average strands",
          round(manual.mean(), 2) == round(region.loc["CARAGA", "avg_strands"], 2),
          f"{manual.mean():.2f}")

    # ---- Headline numbers ----------------------------------------------
    print(f"""
Headline
  Senior-high learners                          {national_shs:,}
  Schools running senior high                   {active:,}
  Classified SHS but zero enrollment            {silent:,}
  Average strands per school (of 8)             {nat_avg:.2f}
  Schools running only ONE strand               {(per_school.strands == 1).sum():,} ({nat_one:.1f}%)
  Learners in single-strand schools             {nat_learners_one:.1f}%
  Widest spread    {region.index[0]} {region.avg_strands.iloc[0]:.2f}  vs  {region.index[-1]} {region.avg_strands.iloc[-1]:.2f}
  STEM in public schools                        {sector_tbl.loc['Public', 'pct_offering_stem']}%
  STEM in private schools                       {sector_tbl.loc['Private', 'pct_offering_stem']}%
""")

    # ---- Save tables ----------------------------------------------------
    region.to_csv(OUT / "output_by_region.csv")
    strand_tbl.to_csv(OUT / "output_by_strand.csv")
    sector_tbl.to_csv(OUT / "output_by_sector.csv")

    # ---- Charts ---------------------------------------------------------
    # Rules followed: axis starts at zero, units labelled, national
    # reference line so every bar has something to be compared against,
    # and a title that states the finding rather than naming the topic.
    def style(ax):
        for side in ("top", "right"):
            ax.spines[side].set_visible(False)
        ax.spines["left"].set_color(MUTED)
        ax.spines["bottom"].set_color(MUTED)
        ax.tick_params(colors=INK, labelsize=9)

    def label_inside(ax, bars, values, fmt):
        """Value labels sit inside the bar, so they never collide with the
        national reference line — which is the whole point of the line."""
        for b, v in zip(bars, values):
            ax.text(v * 0.98, b.get_y() + b.get_height() / 2, fmt(v),
                    va="center", ha="right", fontsize=8.5,
                    color="white", fontweight="bold", zorder=5)

    def national_line(ax, x, label):
        ax.axvline(x, color=INK, ls="--", lw=1.3, zorder=3)
        ax.annotate(label, xy=(x, 1.0), xycoords=("data", "axes fraction"),
                    xytext=(4, 4), textcoords="offset points",
                    fontsize=8.5, color=INK, fontweight="bold")

    # Chart 1 — strands per school by region
    fig, ax = plt.subplots(figsize=(8, 5.2))
    r1 = region.sort_values("avg_strands")
    bars = ax.barh(r1.index, r1.avg_strands,
                   color=[ALERT if v < nat_avg else ACCENT for v in r1.avg_strands])
    ax.set_xlim(0, 8)
    ax.set_xlabel("Average strands running per school (out of 8 possible)", fontsize=9.5, color=INK)
    ax.set_title("The average senior high school runs 2.5 of 8 strands —\n"
                 "and in CARAGA it is closer to 2",
                 fontsize=12.5, fontweight="bold", color=INK, loc="left", pad=12)
    label_inside(ax, bars, r1.avg_strands, lambda v: f"{v:.2f}")
    national_line(ax, nat_avg, f"National {nat_avg:.2f}")
    style(ax)
    fig.tight_layout()
    fig.savefig(CHARTS / "01_strands_per_school_by_region.png", dpi=160)
    plt.close(fig)

    # Chart 2 — learners in single-strand schools
    fig, ax = plt.subplots(figsize=(8, 5.2))
    r2 = region.sort_values("pct_learners_one_strand", ascending=False)
    bars = ax.barh(r2.index, r2.pct_learners_one_strand,
                   color=[ALERT if v > nat_learners_one else MUTED
                          for v in r2.pct_learners_one_strand])
    ax.invert_yaxis()
    ax.set_xlim(0, max(r2.pct_learners_one_strand) * 1.12)
    ax.set_xlabel("% of senior-high learners in a school running only one strand",
                  fontsize=9.5, color=INK)
    ratio = r2.pct_learners_one_strand.iloc[0] / r2.pct_learners_one_strand.iloc[-1]
    ax.set_title(f"A senior-high learner in {r2.index[0]} is {ratio:.0f}x more likely than one in\n"
                 f"{r2.index[-1]} to attend a school running only one strand",
                 fontsize=12.5, fontweight="bold", color=INK, loc="left", pad=12)
    label_inside(ax, bars, r2.pct_learners_one_strand, lambda v: f"{v:.1f}%")
    national_line(ax, nat_learners_one, f"National {nat_learners_one:.1f}%")
    style(ax)
    fig.tight_layout()
    fig.savefig(CHARTS / "02_learners_in_single_strand_schools.png", dpi=160)
    plt.close(fig)

    # Chart 3 — STEM availability by sector
    fig, ax = plt.subplots(figsize=(7.4, 4.2))
    s3 = sector_tbl.sort_values("pct_offering_stem")
    bars = ax.barh(s3.index, s3.pct_offering_stem,
                   color=[ALERT if i == "Public" else ACCENT for i in s3.index])
    ax.set_xlim(0, 100)
    ax.set_xlabel("% of senior high schools in the sector running STEM", fontsize=9.5, color=INK)
    ax.set_title("STEM runs in a quarter of public senior high schools,\n"
                 "and over half of private ones",
                 fontsize=12.5, fontweight="bold", color=INK, loc="left", pad=12)
    for b, v, n in zip(bars, s3.pct_offering_stem, s3.shs_schools):
        ax.text(v - 1.2, b.get_y() + b.get_height() / 2, f"{v:.1f}%  (n={n:,} schools)",
                va="center", ha="right", fontsize=8.5, color="white", fontweight="bold")
    style(ax)
    fig.tight_layout()
    fig.savefig(CHARTS / "03_stem_availability_by_sector.png", dpi=160)
    plt.close(fig)

    print("Wrote 3 CSVs and 3 charts to", OUT)


if __name__ == "__main__":
    main()
