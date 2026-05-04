import copy
import json
from pathlib import Path

_SCHEMA_PATH = Path(__file__).parent.parent.parent / "docs" / "schema.json"

with open(_SCHEMA_PATH) as _f:
    _ORIGINAL: dict = json.load(_f)

# Mutable in-memory stores — mutated by PUT/POST endpoints at runtime
members_store: list[dict] = copy.deepcopy(_ORIGINAL["members"])
prayer_requests_store: list[dict] = copy.deepcopy(_ORIGINAL["prayer_requests"])
meeting_minutes_store: list[dict] = copy.deepcopy(_ORIGINAL["meeting_minutes"])


def reset_to_seed() -> None:
    """Restore all stores to the original seed data. Used by tests."""
    members_store.clear()
    members_store.extend(copy.deepcopy(_ORIGINAL["members"]))
    prayer_requests_store.clear()
    prayer_requests_store.extend(copy.deepcopy(_ORIGINAL["prayer_requests"]))
    meeting_minutes_store.clear()
    meeting_minutes_store.extend(copy.deepcopy(_ORIGINAL["meeting_minutes"]))
