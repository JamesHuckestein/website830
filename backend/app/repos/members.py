from datetime import date, timedelta

from app.dynamo import (
    delete_item,
    get_item,
    put_item_unique,
    scan_table,
    update_item,
)

TABLE = "members"
ADMIN_MEMBER_NUMBER = "830999999"


def get_by_number(member_number: str) -> dict | None:
    return get_item(TABLE, {"member_number": member_number})


def list_all(exclude_admin: bool = True) -> list[dict]:
    from boto3.dynamodb.conditions import Attr
    if exclude_admin:
        return scan_table(TABLE, filter_expression=Attr("is_admin").ne(True))
    return scan_table(TABLE)


def create(member: dict) -> bool:
    """Create a new member. Returns False if member_number already exists."""
    return put_item_unique(TABLE, member, "member_number")


def update_contact(member_number: str, contact: dict) -> dict | None:
    return update_item(TABLE, {"member_number": member_number}, contact)


def update_full(member_number: str, fields: dict) -> dict | None:
    return update_item(TABLE, {"member_number": member_number}, fields)


def update_passcode(member_number: str, passcode: str) -> dict | None:
    return update_item(TABLE, {"member_number": member_number}, {"passcode": passcode})


def delete(member_number: str) -> bool:
    return delete_item(TABLE, {"member_number": member_number})


def get_birthdays(days: int = 30) -> list[dict]:
    """Return non-admin members with a birthday in the next N days."""
    from boto3.dynamodb.conditions import Attr
    members = scan_table(TABLE, filter_expression=Attr("is_admin").ne(True) & Attr("birthday").exists())
    today = date.today()
    cutoff = today + timedelta(days=days)
    result = []
    for m in members:
        if not m.get("birthday"):
            continue
        bday = date.fromisoformat(m["birthday"])
        for year in (today.year, today.year + 1):
            try:
                candidate = bday.replace(year=year)
            except ValueError:
                candidate = bday.replace(year=year, day=28)
            if today <= candidate <= cutoff:
                result.append(m)
                break
    return result


def get_officer_emails() -> list[str]:
    """Return email addresses of all members with an officer_position set (excluding admin)."""
    from boto3.dynamodb.conditions import Attr
    members = scan_table(
        TABLE,
        filter_expression=Attr("officer_position").exists() & Attr("officer_position").ne(None) & Attr("is_admin").ne(True),
    )
    return [m["email"] for m in members if m.get("email")]


def get_all_emails(exclude_admin: bool = True) -> list[str]:
    """Return email addresses of all members (excluding admin by default)."""
    members = list_all(exclude_admin=exclude_admin)
    return [m["email"] for m in members if m.get("email")]


def get_by_officer_position(title: str) -> dict | None:
    """Return the member holding the given officer position, or None."""
    from boto3.dynamodb.conditions import Attr
    items = scan_table(
        TABLE,
        filter_expression=Attr("officer_position").eq(title) & Attr("is_admin").ne(True),
    )
    return items[0] if items else None


def clear_officer_position(member_number: str) -> dict | None:
    return update_item(TABLE, {"member_number": member_number}, {"officer_position": None})


def set_officer_position(member_number: str, title: str) -> dict | None:
    return update_item(TABLE, {"member_number": member_number}, {"officer_position": title})


def is_admin(member_number: str) -> bool:
    return member_number == ADMIN_MEMBER_NUMBER
