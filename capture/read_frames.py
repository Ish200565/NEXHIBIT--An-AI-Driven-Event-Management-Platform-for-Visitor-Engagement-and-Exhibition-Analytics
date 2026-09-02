
import cv2

video_path = "ish_test.mp4"
cap = cv2.VideoCapture(video_path)

frame_count = 0
while True:
    success, frame = cap.read()
    if not success:
        break  # video ended
    frame_count += 1
    print(f"Read frame {frame_count}, shape: {frame.shape}")

cap.release()
print(f"Total frames read: {frame_count}")