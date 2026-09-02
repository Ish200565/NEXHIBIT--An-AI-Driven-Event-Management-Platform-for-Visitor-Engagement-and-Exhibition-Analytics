## Embedding Specification

- Model: osnet_x1_0 (torchreid)
- Output dimension: 512
- Normalization: L2-normalized (confirm via features.norm() ≈ 1.0)
- Input size expected: (256, 128)
- Distance metric for matching: cosine similarity


## Check-in Capture & Embedding Pipeline (Ishika)

This module handles everything from a visitor's check-in video to a stored, 
matchable identity embedding. Files are organized by pipeline stage:

### 1. `read_frames.py`
Reads a video file frame-by-frame using OpenCV and confirms frame count and 
shape consistency. Used as an initial sanity check on any new video before 
running it through the rest of the pipeline.

### 2. `split_by_person.py` (testing utility, not production)
Splits one continuous multi-person test recording into separate per-person 
clips (`person1.mp4`, `person2.mp4`, ...) using manually identified timestamps. 
This exists only because test footage was recorded as one clip with multiple 
people for convenience. In production, each check-in produces its own 
single-visitor video directly, so this script is not part of the live pipeline.

### 3. `crop_frames.py`
Takes a single-person video and extracts every frame, then applies a fixed 
center-crop (assumes a kiosk camera with the visitor standing centered) to 
isolate the person from surrounding background. Outputs one cropped image 
per frame into a `crops/<person>` folder.

Automatic person detection (OpenCV HOG) was evaluated and dropped — HOG was 
removed from OpenCV 5.0's Python bindings, and a static center-crop is a 
reasonable substitute for a fixed, controlled kiosk camera position anyway.

### 4. `filter_sharp.py`
Scores every cropped frame using Laplacian variance (a standard blur-detection 
metric — higher variance means a sharper image) and keeps only the top 5 
sharpest crops per person. Reduces ~300 raw frames down to a handful of 
clean images worth feeding into the embedding model.

### 5. `embedding.py`
Loads a pretrained OSNet (`osnet_x1_0`, via torchreid) and extracts a 512-dim 
feature embedding from each of the top 5 sharpest crops. These 5 embeddings 
are averaged and L2-normalized into a single stored embedding representing 
that visitor. Also computes pairwise cosine similarity between different 
people's embeddings, and between multiple frames of the same person, to 
validate that the model actually distinguishes between individuals.

---

## Embedding Specification
- Model: osnet_x1_0 (torchreid)
- Output dimension: 512
- Normalization: L2-normalized (confirmed via `embedding.norm()` ≈ 1.0)
- Input size expected: (256, 128)
- Distance metric for matching: cosine similarity

## Matching Threshold (empirical, Week 2 test)
- Same-person similarity observed: ~0.96
- Different-person similarity observed: ~0.63–0.72
- Working threshold: 0.80 (to be tuned further with larger test set)

## Testing Note
Test videos were recorded as one continuous multi-person clip and split using 
`split_by_person.py` to simulate individual check-in captures. 
In production, each check-in produces its own single-visitor video directly.


                                        ## Environment Setup

### 0. Install Anaconda (or Miniconda) — prerequisite
If `conda` isn't recognized in your terminal, install it first:
- Download Anaconda: https://www.anaconda.com/download (full version, includes 
  many packages by default — larger install, ~3GB)
- Or Miniconda: https://docs.conda.io/en/latest/miniconda.html (minimal, 
  installs conda only — lighter, recommended if disk space matters)

During installation on Windows, check the option to add conda to PATH (or use 
the "Anaconda Prompt" it installs instead of a regular terminal).

Verify it worked:
```bash
conda --version
```

### 1. Create and activate a conda environment
```bash
conda create -n torchreid python=3.10
conda activate torchreid
```

### 2. Install core dependencies
```bash
pip install numpy
pip install torch torchvision
pip install opencv-python
```

**Note on OpenCV version:** This project uses the latest OpenCV (5.x), which 
removed `HOGDescriptor` (OpenCV's older built-in person detector) from its 
Python bindings. As a result, `crop_frames.py` does not perform automatic 
person detection — it applies a fixed center-crop instead, based on the 
assumption of a stationary kiosk camera with the visitor standing centered.

### 3. Install Git (if not already installed) — needed for the next step
- Download: https://git-scm.com/downloads
Verify:
```bash
git --version
```

### 4. Get torchreid (for OSNet)
Clone the repo separately (not inside this project folder):
```bash
git clone https://github.com/KaiyangZhou/deep-person-reid.git
```

**Do not run `pip install -e .`** on this repo unless you have a C++ build 
toolchain installed — it attempts to compile an optional Cython extension 
(`rank_cy`, used only for training-time evaluation speed) that requires 
Microsoft C++ Build Tools on Windows. This project only needs inference 
(`FeatureExtractor`), which works without that extension.

Instead, reference the cloned folder directly in code:
```python
import sys
sys.path.append(r"path/to/deep-person-reid")
import torchreid
```
Update the path in `embedding.py` to match wherever `deep-person-reid` is 
cloned on your machine.

### 5. First run
The first time `embedding.py` runs, it auto-downloads OSNet's pretrained 
ImageNet weights (~10MB) to a local cache — this only happens once.

### 6. Verify full setup
```bash
python -c "import cv2, torch; import sys; sys.path.append(r'path/to/deep-person-reid'); import torchreid; print('OK')"
```