#This code is only used for a single video containing multiple persons if there are separate videos then use the commented code after this code 
import cv2
import os
import shutil

def sharpness(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    return cv2.Laplacian(gray, cv2.CV_64F).var()

def filter_sharp(input_dir, output_dir, top_n=5):
    os.makedirs(output_dir, exist_ok=True)
    scores = []
    for fname in os.listdir(input_dir):
        img = cv2.imread(os.path.join(input_dir, fname))
        if img is None:
            continue
        scores.append((fname, sharpness(img)))

    scores.sort(key=lambda x: x[1], reverse=True)
    for fname, score in scores[:top_n]:
        shutil.copy(os.path.join(input_dir, fname), os.path.join(output_dir, fname))
        print(f"[{output_dir}] {fname}: sharpness={score:.1f}")

if __name__ == "__main__":
    people = {
        "crops/person1": "crops_best/person1",
        "crops/person2": "crops_best/person2",
        "crops/person3": "crops_best/person3",
    }
    for input_dir, output_dir in people.items():
        filter_sharp(input_dir, output_dir)










# import cv2
# import os
# import shutil

# input_dir = "crops"
# output_dir = "crops_best"
# os.makedirs(output_dir, exist_ok=True)

# def sharpness(image):
#     gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
#     return cv2.Laplacian(gray, cv2.CV_64F).var()

# scores = []
# for fname in os.listdir(input_dir):
#     img = cv2.imread(os.path.join(input_dir, fname))
#     if img is None:
#         continue
#     scores.append((fname, sharpness(img)))

# scores.sort(key=lambda x: x[1], reverse=True)
# top_n = scores[:5]

# for fname, score in top_n:
#     shutil.copy(os.path.join(input_dir, fname), os.path.join(output_dir, fname))
#     print(f"{fname}: sharpness={score:.1f}")

# print(f"Saved top {len(top_n)} sharpest crops to {output_dir}/")