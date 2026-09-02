#This code is only used for a single video containing multiple persons if there are separate videos then use the commented code after this code 
import cv2
import os

def crop_frames(video_path, output_dir):
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
        crop = frame[int(h*0.1):h, int(w*0.25):int(w*0.75)]

        saved += 1
        cv2.imwrite(f"{output_dir}/frame_{frame_count}.jpg", crop)

    cap.release()
    print(f"[{video_path}] frames read: {frame_count}, crops saved: {saved}")

if __name__ == "__main__":
    people = {
        "person1.mp4": "crops/person1",
        "person2.mp4": "crops/person2",
        "person3.mp4": "crops/person3",
    }
    for video_path, output_dir in people.items():
        crop_frames(video_path, output_dir)








# import cv2
# import os

# video_path = "ish_test.mp4"
# output_dir = "crops"
# os.makedirs(output_dir, exist_ok=True)

# cap = cv2.VideoCapture(video_path)
# frame_count = 0
# saved = 0

# while True:
#     success, frame = cap.read()
#     if not success:
#         break
#     frame_count += 1

#     h, w = frame.shape[:2]
#     # center-crop: assume visitor stands roughly centered at the kiosk
#     crop = frame[int(h*0.1):h, int(w*0.25):int(w*0.75)]

#     saved += 1
#     cv2.imwrite(f"{output_dir}/frame_{frame_count}.jpg", crop)

# cap.release()
# print(f"Total frames read: {frame_count}, crops saved: {saved}")


# Check-in capture assumes a fixed kiosk camera
#  position with the visitor centered in frame, 
# so a static center-crop is used instead of a detection model — 
# appropriate for a controlled check-in point, unlike the overhead stall 
# cameras which require full person detection across a moving crowd.