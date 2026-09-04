# NExhibit — Computer Vision & Re-ID Module (Ishika)

This covers the check-in capture, embedding extraction, storage, and 
matching pipeline — the identity side of NExhibit's privacy-preserving 
visitor tracking system.

---

## Folder Structure
NEXHIBIT/
├── capture/
│ ├── read_frames.py
│ ├── crop_frames.py
│ ├── filter_sharp.py
│ ├── testing_utils/
│ │ └── split_by_person.py
│ ├── crops/ (gitignored — generated output)
│ └── crops_best/ (gitignored — generated output)
├── embedding/
│ ├── embedding.py
│ └── testing_utils/
│ └── test_extract.py
├── storage/
│ ├── store.py
│ └── visitor_embeddings.json (gitignored — generated data)
├── matching/
│ ├── match.py
│ └── test_match.py
├── cv_track/ (Rohit's detection/tracking module)
├── README.md
├── requirements.txt
└── .gitignore



---

## Pipeline Overview

### 1. `capture/read_frames.py`
Reads a video file frame-by-frame using OpenCV and confirms frame count and 
shape consistency. Used as an initial sanity check on any new video before 
running it through the rest of the pipeline.

### 2. `capture/testing_utils/split_by_person.py` (testing utility, not production)
Splits one continuous multi-person test recording into separate per-person 
clips (`person1.mp4`, `person2.mp4`, ...) using manually identified timestamps. 
This exists only because test footage was recorded as one clip with multiple 
people for convenience. In production, each check-in produces its own 
single-visitor video directly, so this script is not part of the live pipeline.

### 3. `capture/crop_frames.py`
Takes a single-person video and extracts every frame, then applies a fixed 
center-crop (assumes a kiosk camera with the visitor standing centered) to 
isolate the person from surrounding background. Outputs one cropped image 
per frame into a `crops/<person>` folder.

Automatic person detection (OpenCV HOG) was evaluated and dropped — HOG was 
removed from OpenCV 5.0's Python bindings, and a static center-crop is a 
reasonable substitute for a fixed, controlled kiosk camera position anyway.

### 4. `capture/filter_sharp.py`
Scores every cropped frame using Laplacian variance (a standard blur-detection 
metric — higher variance means a sharper image) and keeps only the top 5 
sharpest crops per person. Reduces ~300 raw frames down to a handful of 
clean images worth feeding into the embedding model.

### 5. `embedding/embedding.py`
Loads a pretrained OSNet (`osnet_x1_0`, via torchreid) and extracts a 512-dim 
feature embedding from each of the top 5 sharpest crops. These 5 embeddings 
are averaged and L2-normalized into a single stored embedding representing 
that visitor, tagged with a real Visitor ID (e.g. `V1001`). Also computes 
pairwise cosine similarity between different people's embeddings, and between 
multiple frames of the same person, to validate that the model actually 
distinguishes between individuals. Calls `storage/store.py` to persist each 
visitor's embedding.

### `embedding/testing_utils/test_extract.py` (diagnostic utility, not production)
Minimal script that loads OSNet and runs it on a single test image — no crops 
folder, no storage, no dependencies on the rest of the pipeline. Kept as a 
fast way to check whether an issue is with OSNet/torchreid itself versus the 
project's own pipeline logic.

### 6. `storage/store.py`
Persistent key-value storage for visitor embeddings, backed by a local JSON 
file (`visitor_embeddings.json`). Provides `save_embedding()`, 
`load_embedding()`, and `load_all()`. Path is anchored to the script's own 
location (not the current working directory), so it resolves consistently 
regardless of which folder a script is run from.

### 7. `matching/match.py`
Given a new query embedding (simulating a camera crop), compares it against 
every stored visitor embedding using cosine similarity and returns the 
closest match. Returns no match if the best score falls below the confidence 
threshold, rather than force-assigning to the nearest (but likely wrong) 
stored identity.

### `matching/test_match.py`
Test script that re-extracts an embedding from an existing crop, runs it 
through `match.py`, and confirms it correctly matches back to its own 
Visitor ID with high confidence — validating the full pipeline end-to-end 
(capture → embedding → storage → matching).

---

## Embedding Specification
- Model: `osnet_x1_0` (torchreid)
- Output dimension: 512
- Normalization: L2-normalized (confirmed via `embedding.norm()` ≈ 1.0)
- Input size expected: (256, 128)
- Distance metric for matching: cosine similarity

## Matching Threshold (empirical, Week 2–3 test)
- Same-person similarity observed: ~0.96 (two frames, same person)
- Different-person similarity observed: ~0.63–0.72 (three distinct people)
- Working threshold: **0.80** (to be tuned further with a larger test set)
- Confirmed end-to-end: a held-out crop of a known visitor matched correctly 
  at 0.878 confidence

## Testing Note
Test videos were recorded as one continuous multi-person clip and split using 
`capture/testing_utils/split_by_person.py` to simulate individual check-in 
captures. In production, each check-in produces its own single-visitor video 
directly, so this script is not used in the live system.

---

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

#### If `conda --version` is not recognized

This means Anaconda is installed, but this terminal doesn't have conda on its 
PATH. Two ways to fix it:

**Quick fix — use Anaconda Prompt instead:**
Search Start menu for "Anaconda Prompt" and use that terminal instead of 
regular PowerShell/CMD. It already has conda configured — no setup needed.

**Permanent fix — register conda into PowerShell:**
Open Anaconda Prompt once and run:
```bash
conda init powershell
```
Close and reopen your terminal (or VS Code's integrated terminal). 
`conda activate` will now work everywhere going forward.

If PowerShell blocks the script on reopen (execution policy error), run this 
once in PowerShell **as Administrator**, then retry:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 1. Create and activate a conda environment
```bash
conda create -n torchreid python=3.10
conda activate torchreid
```
Do not also create a separate `venv` inside the project — use this conda 
environment exclusively to avoid path conflicts between two environment 
managers.

### 2. Install core dependencies
```bash
pip install numpy scipy
pip install torch torchvision
pip install opencv-python
```

**Note on OpenCV version:** This project uses the latest OpenCV (5.x), which 
removed `HOGDescriptor` (OpenCV's older built-in person detector) from its 
Python bindings. As a result, `crop_frames.py` does not perform automatic 
person detection — it applies a fixed center-crop instead, based on the 
assumption of a stationary kiosk camera with the visitor standing centered.

### 3. Install Git (if not already installed)
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
Update this path in `embedding/embedding.py` to match wherever 
`deep-person-reid` is cloned on your machine.

If you hit `ModuleNotFoundError` for `scipy`, `yacs`, `gdown`, or similar 
while importing torchreid, install the repo's own requirements in one shot:
```bash
cd path\to\deep-person-reid
pip install -r requirements.txt
```

### 5. First run
The first time `embedding.py` runs, it auto-downloads OSNet's pretrained 
ImageNet weights (~10MB) to a local cache — this only happens once.

### 6. Verify full setup
```bash
python -c "import cv2, torch; import sys; sys.path.append(r'path/to/deep-person-reid'); import torchreid; print('OK')"
```

---

## Running the Pipeline

Run from the project root (`NEXHIBIT/`) for consistent path resolution:

```bash
python capture/read_frames.py
python capture/crop_frames.py
python capture/filter_sharp.py
python embedding/embedding.py
python matching/test_match.py
```

Expected result at the end: a test crop correctly matches its own stored 
Visitor ID with confidence above the 0.80 threshold.