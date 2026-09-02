#This file is only used for a single video containing multiple persons

import cv2

def extract_clip(input_path, output_path, start_sec, end_sec):
    cap = cv2.VideoCapture(input_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, 
                           (int(cap.get(3)), int(cap.get(4))))
    cap.set(cv2.CAP_PROP_POS_FRAMES, int(start_sec * fps))
    while cap.get(cv2.CAP_PROP_POS_FRAMES) < end_sec * fps:
        success, frame = cap.read()
        if not success:
            break
        out.write(frame)
    cap.release()
    out.release()

extract_clip("ish_test.mp4", "person1.mp4", 0, 2)
extract_clip("ish_test.mp4", "person2.mp4", 2, 5)
extract_clip("ish_test.mp4", "person3.mp4", 5, 10)