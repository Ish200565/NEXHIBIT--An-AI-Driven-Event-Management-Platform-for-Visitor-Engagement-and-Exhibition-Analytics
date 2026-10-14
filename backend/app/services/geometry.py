from typing import Optional, Sequence


def point_in_polygon(x: float, y: float, poly: Sequence[Sequence[float]]) -> bool:
    """Ray casting. Works for any simple polygon, not just rectangles."""
    inside = False
    n = len(poly)
    j = n - 1
    for i in range(n):
        xi, yi = poly[i]
        xj, yj = poly[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / ((yj - yi) or 1e-12) + xi:
            inside = not inside
        j = i
    return inside


def stall_for_point(nx: float, ny: float, stalls) -> Optional[str]:
    for s in stalls:
        if s.zone and len(s.zone) >= 3 and point_in_polygon(nx, ny, s.zone):
            return s.stall_id
    return None
