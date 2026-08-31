import cv2
import os

video_path = "entry_video.mp4"
output_dir = "crops"
os.makedirs(output_dir, exist_ok=True)

cap = cv2.VideoCapture(video_path)
frame_count = 0
saved = 0

while True:
    success, frame = cap.read()
    if not success:
        break
    frame_count += 1

    h, w = frame.shape[:2]
    # center-crop: assume visitor stands roughly centered at the kiosk
    crop = frame[int(h*0.1):h, int(w*0.25):int(w*0.75)]

    saved += 1
    cv2.imwrite(f"{output_dir}/frame_{frame_count}.jpg", crop)

cap.release()
print(f"Total frames read: {frame_count}, crops saved: {saved}")


# Check-in capture assumes a fixed kiosk camera
#  position with the visitor centered in frame, 
# so a static center-crop is used instead of a detection model — 
# appropriate for a controlled check-in point, unlike the overhead stall 
# cameras which require full person detection across a moving crowd.