import cv2


def crop_person(frame, bbox, padding=0.05):
    x1, y1, x2, y2 = map(int, bbox)

    h, w = frame.shape[:2]

    box_width = x2 - x1
    box_height = y2 - y1

    pad_x = int(box_width * padding)
    pad_y = int(box_height * padding)

    x1 = max(0, x1 - pad_x)
    y1 = max(0, y1 - pad_y)
    x2 = min(w, x2 + pad_x)
    y2 = min(h, y2 + pad_y)

    if x2 <= x1 or y2 <= y1:
        return None

    crop = frame[y1:y2, x1:x2]

    if crop.size == 0:
        return None

    return crop


def is_good_crop(crop, min_width=50, min_height=100):
    if crop is None:
        return False

    h, w = crop.shape[:2]

    return w >= min_width and h >= min_height


def sharpness(crop):
    """
    Higher value = sharper image.
    """

    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)

    return cv2.Laplacian(
        gray,
        cv2.CV_64F
    ).var()


def keep_best_crop(best_crops, track_id, crop, max_crops=5):
    """
    Keep the top 5 sharpest crops for each Track ID.
    """

    score = sharpness(crop)

    if track_id not in best_crops:
        best_crops[track_id] = []

    best_crops[track_id].append((score, crop))

    # Sort from sharpest to least sharp
    best_crops[track_id].sort(
        key=lambda x: x[0],
        reverse=True
    )

    # Keep only the best 5
    best_crops[track_id] = best_crops[track_id][:max_crops]