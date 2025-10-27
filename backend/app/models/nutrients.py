from pathlib import Path
import logging
import math

logger = logging.getLogger(__name__)

# Possible nutrient file names (user will add one of these to the models folder)
MODEL_DIR = Path(__file__).parent
# Old fixed paths (kept for backward compatibility)
XLSX_PATH = MODEL_DIR / "nutrients.xlsx"
CSV_PATH = MODEL_DIR / "nutrients.csv"

def _find_nutrients_file():
    """Find any file in models dir that likely contains nutrients data.

    Priority: any file with 'nutrient' in the name (xlsx/xls preferred),
    then fallback to exact names nutrients.xlsx / nutrients.csv.
    Returns Path or None.
    """
    # look for files containing 'nutrient' in name
    candidates = []
    for p in MODEL_DIR.iterdir():
        if not p.is_file():
            continue
        name = p.name.lower()
        if 'nutrient' in name:
            # prefer excel over csv
            if p.suffix.lower() in ('.xlsx', '.xls'):
                candidates.insert(0, p)
            else:
                candidates.append(p)

    if candidates:
        return candidates[0]

    # fallback to exact paths
    if XLSX_PATH.exists():
        return XLSX_PATH
    if CSV_PATH.exists():
        return CSV_PATH

    return None

_cache = None

try:
    import pandas as _pd
    _PANDAS_AVAILABLE = True
except Exception:
    _pd = None
    _PANDAS_AVAILABLE = False


def _load_table():
    """Load nutrients table into a dict mapping normalized dish names -> nutrient dict.

    Supports Excel (.xlsx/.xls) via pandas if available, or CSV via csv.DictReader.
    If no file or required library missing, returns empty dict.
    """
    global _cache
    if _cache is not None:
        return _cache

    _cache = {}

    path = _find_nutrients_file()

    if path is None:
        logger.info("No nutrients file found in models folder")
        return _cache

    try:
        if path.suffix.lower() in ('.xlsx', '.xls'):
            if not _PANDAS_AVAILABLE:
                logger.warning("Pandas not available: cannot read Excel nutrients file %s", path)
                return _cache
            df = _pd.read_excel(path)
            rows = df.to_dict(orient='records')
        else:
            # CSV fallback
            import csv
            with path.open('r', encoding='utf-8') as fh:
                reader = csv.DictReader(fh)
                rows = [r for r in reader]

        # Expect a column identifying the dish name. Try common names.
        for r in rows:
            # Determine dish name column
            dish_key = None
            for candidate in ('dish', 'name', 'dish_name'):
                if candidate in r and r[candidate]:
                    dish_key = candidate
                    break
            if dish_key is None:
                # Try first column
                if len(r) == 0:
                    continue
                dish_key = list(r.keys())[0]

            dish_name_raw = r.get(dish_key)
            if dish_name_raw is None:
                continue
            # Normalize to match model class string convention: lowercase and underscores
            dish_norm = str(dish_name_raw).strip().lower().replace(' ', '_')

            # Remove the identifying column from nutrient data
            nutrient_data = {k: v for k, v in r.items() if k != dish_key}

            # Optionally convert numeric strings to numbers where possible
            cleaned = {}
            for k, v in nutrient_data.items():
                # Normalize pandas/numpy missing values to None
                try:
                    if _PANDAS_AVAILABLE and _pd.isna(v):
                        cleaned[k] = None
                        continue
                except Exception:
                    pass

                if v is None:
                    cleaned[k] = None
                    continue

                # If it's a numeric NaN from math/numpy
                try:
                    if isinstance(v, float) and math.isnan(v):
                        cleaned[k] = None
                        continue
                except Exception:
                    pass

                # Try to coerce numeric strings to numbers
                if isinstance(v, str):
                    vs = v.replace(',', '').strip()
                    if vs == '':
                        cleaned[k] = None
                        continue
                    # If looks like a number
                    try:
                        if '.' in vs:
                            cleaned[k] = float(vs)
                        else:
                            cleaned[k] = int(vs)
                        continue
                    except Exception:
                        # leave as string
                        cleaned[k] = v
                        continue

                # Convert numpy/pandas scalar types to native Python types if possible
                try:
                    # e.g., numpy.int64, numpy.float64
                    import numpy as _np
                    if isinstance(v, (_np.integer, _np.int_)):
                        cleaned[k] = int(v)
                        continue
                    if isinstance(v, (_np.floating, _np.float_)):
                        fv = float(v)
                        if math.isnan(fv):
                            cleaned[k] = None
                        else:
                            cleaned[k] = fv
                        continue
                except Exception:
                    pass

                # Fallback: keep value as-is
                cleaned[k] = v

            _cache[dish_norm] = cleaned

        logger.info("Loaded %d nutrient entries from %s", len(_cache), path)
    except Exception as exc:
        logger.exception("Failed to load nutrients file %s: %s", path, exc)

    return _cache


def get_nutrients_for(dish_name):
    """Return nutrients dict for a dish name (normalized), or None if not found."""
    if not dish_name:
        return None
    table = _load_table()
    key = str(dish_name).strip().lower().replace(' ', '_')
    # direct lookup
    if key in table:
        return table.get(key)

    # quick normalizations
    alt = key.replace('ghost', 'gosht')
    if alt in table:
        return table.get(alt)
    alt2 = key.replace('gosht', 'ghost')
    if alt2 in table:
        return table.get(alt2)

    # remove punctuation and parentheses
    import re
    key_clean = re.sub(r"[^a-z0-9_]", "", key)
    if key_clean in table:
        return table.get(key_clean)

    # fuzzy match against available keys
    try:
        import difflib
        candidates = difflib.get_close_matches(key, list(table.keys()), n=1, cutoff=0.6)
        if candidates:
            return table.get(candidates[0])
    except Exception:
        pass

    return None


# Eagerly load table at import time so a running server (with reload) will pick up files
try:
    _load_table()
except Exception:
    # non-fatal; loader logs will report issues
    pass
