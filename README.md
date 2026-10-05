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

## Pipeline Overview (Check-in / Identity Side — Ishika)

### 1. `capture/read_frames.py`
Reads a video file frame-by-frame using OpenCV and confirms frame count and 
shape consistency. Used as an initial sanity check on any new video before 
running it through the rest of the pipeline.

### 2. `capture/testing_utils/split_by_person.py` (testing utility, not production)
Splits one continuous multi-person test recording into separate per-person 
clips using manually identified timestamps. Exists only because test footage 
was recorded as one clip with multiple people for convenience. In production, 
each check-in produces its own single-visitor video directly.

### 3. `capture/crop_frames.py`
Takes a single-person video and extracts every frame, then applies a fixed 
center-crop (assumes a kiosk camera with the visitor standing centered) to 
isolate the person from surrounding background. Automatic person detection 
(OpenCV HOG) was evaluated and dropped — HOG was removed from OpenCV 5.0's 
Python bindings, and a static center-crop is a reasonable substitute for a 
fixed, controlled kiosk camera position.

### 4. `capture/filter_sharp.py`
Scores every cropped frame using Laplacian variance and keeps only the top 5 
sharpest crops per person, reducing ~300 raw frames to a handful of clean 
images worth embedding.

### 5. `embedding/embedding.py`
Loads OSNet via torchreid and extracts a 512-dim feature embedding from each 
of the top 5 sharpest crops, averages and L2-normalizes them into one stored 
embedding per visitor, tagged with a real Visitor ID (e.g. `V1001`). Calls 
`storage/store.py` to persist each visitor's embedding.

### 6. `storage/store.py`
Persistent key-value storage for visitor embeddings, backed by a local JSON 
file (`visitor_embeddings.json`). Provides `save_embedding()`, 
`load_embedding()`, and `load_all()`. Path is anchored to the script's own 
location so it resolves consistently regardless of which folder a script is 
run from.

### 7. `matching/match.py`
Compares a new query embedding against every stored visitor embedding using 
cosine similarity and returns the closest match, or no match if the best 
score falls below the confidence threshold.

---

## Pipeline Overview (Live Tracking Side — Rohit)

### `cv_track/tracking.py` + YOLOv8 + ByteTrack
Detects people in exhibition video frame-by-frame (YOLOv8) and assigns 
persistent track IDs across frames (ByteTrack), configured via 
`trackers/my_bytetrack.yaml`.

### `cv_track/cropping.py`
Expands detected bounding boxes, filters out poor-quality crops, scores 
sharpness, and keeps the best 5 crops per track ID.

### `cv_track/reid.py`
Loads OSNet and generates an averaged, normalized embedding from a track's 
best crops — the live-camera equivalent of `embedding/embedding.py`.

### `cv_track/matching.py`
Compares a live track's embedding against known reference embeddings using 
cosine similarity; returns `"UNKNOWN"` if the best score is below threshold.

### `cv_track/run_reid.py`
The integrated workflow: runs YOLO+ByteTrack on exhibition footage, collects 
best crops per track, re-identifies each track against known visitors, and 
prints a final presence summary.

---

## Why MSMT17 Instead of the Default ImageNet Checkpoint

OSNet via torchreid defaults to ImageNet-pretrained weights if no checkpoint 
path is given — these are trained for general object classification, not 
specifically for telling people apart. Early testing used these default 
weights (shown in Week 2 results below) and worked, but was more sensitive 
to shared background and lighting between crops than ideal.

`osnet_x1_0_msmt17.pth` is OSNet **finetuned specifically on the MSMT17 
person re-identification benchmark** — trained explicitly to distinguish 
people by appearance, not general objects. Switching to this checkpoint was 
driven by the integration process itself (see below), and produced a 
measurably wider, cleaner gap between same-person and different-person 
similarity scores once adopted project-wide.

---

## Integration Process: My Pipeline + Rohit's Pipeline

### The problem before integration
Two separate, independently-working systems existed:
- My check-in pipeline: register → crop → embed → store in 
  `visitor_embeddings.json`
- Rohit's live tracking pipeline: detect → track → crop → re-identify, but 
  rebuilding reference embeddings directly from image folders every run, 
  never reading my stored JSON database

The two systems never actually exchanged data — Rohit's live matching had no 
access to real registered visitors, only folder-based test images.

### Step 1 — Wire `cv_track/run_reid.py` to shared storage
Replaced Rohit's folder-based `build_reference_embeddings()` function (which 
rebuilt embeddings from `capture/crops_best/<person>/` every run) with a call 
into my `storage/store.py`:
```python
from storage.store import load_all

def build_reference_embeddings(reid):
    stored = load_all()
    return {visitor_id: torch.tensor(emb) for visitor_id, emb in stored.items()}
```
This made real registered Visitor IDs (V1001, V1002, V1003) the actual 
reference set for live matching, instead of rebuilt folder data.

### Step 2 — Fixed a structural bug found during integration
`run_reid.py`'s final summary block had lost its indentation and was sitting 
**outside** the `main()` function entirely — it referenced a now-removed 
`PERSON_NAMES` variable and would have crashed or behaved unpredictably. 
Reindented it correctly inside `main()`, removed a duplicate/redundant 
reference-embedding rebuild that was happening a second time right before 
the summary print, and removed duplicate unused imports.

### Step 3 — Resolved a threshold mismatch
My matcher used `threshold=0.80` (tuned on clean, centered kiosk crops). 
Rohit's `run_reid.py` used `THRESHOLD = 0.40` (tuned/guessed for noisier live 
tracking crops — motion blur, angle, distance). These were two different 
numbers for the same underlying comparison, discovered during the audit. 
Agreed on a shared **provisional threshold of 0.60** as a starting point, 
pending empirical calibration on real tracking footage, and applied it 
consistently across `cv_track/matching.py`'s default and `run_reid.py`'s 
`THRESHOLD` constant.

### Step 4 — Found and fixed a silent embedding-format mismatch
Before trusting any cross-pipeline similarity score, ran a direct 
compatibility check: the exact same image through both my `embedding.py` and 
Rohit's `reid.py`.

- **First attempt:** `reid.py` couldn't find `models/osnet_x1_0_msmt17.pth` 
  (a relative path that only resolved from inside `cv_track/`), silently fell 
  back to ImageNet weights. Cross-check similarity: **1.0000** — looked 
  perfect, but only because both sides had silently fallen back to the same 
  (wrong) default.
- **After placing the MSMT17 checkpoint correctly:** cross-check similarity 
  dropped to **0.4535** — revealing that ImageNet-embedding (mine) and 
  MSMT17-embedding (Rohit's) vectors are **not comparable** — different 
  training objectives place "closeness" differently in the 512-dim space.
- **Fix:** standardized the entire project on MSMT17. Updated 
  `embedding/embedding.py` to load the MSMT17 checkpoint (anchored to an 
  absolute path, not a relative one — same fix pattern applied earlier to 
  `store.py`). Deleted and regenerated `visitor_embeddings.json` from 
  scratch so all stored visitor embeddings use the same checkpoint as the 
  live tracking side.
- **Re-ran the compatibility check:** similarity returned to **1.0000** — 
  confirmed both pipelines now produce identical embeddings for identical 
  input.

### Roles in the integration
- **Ishika:** built and owns the check-in/storage/matching pipeline, 
  diagnosed and fixed all path-resolution bugs (storage, embedding, matching, 
  and later `reid.py`'s model path), ran the cross-pipeline compatibility 
  test, identified and resolved the checkpoint mismatch, regenerated all 
  stored visitor data under MSMT17, ran and validated the final end-to-end 
  and unknown-rejection tests.
- **Rohit:** built and owns detection/tracking (YOLOv8 + ByteTrack), 
  cropping, live Re-ID extraction, and the `run_reid.py` orchestration 
  script; supplied the MSMT17 checkpoint and exhibition test footage 
  (`exhibition3.mp4`).

---

## Threshold Evolution: 0.80 → 0.60

| Stage | Threshold | Basis |
|---|---|---|
| Original (check-in pipeline, ImageNet) | 0.80 | Tuned on clean kiosk crops |
| Rohit's original (live tracking) | 0.40 | Informal, untested guess for noisier live crops |
| Agreed provisional value | 0.60 | Midpoint, pending real calibration data |
| **Final, validated on live footage (MSMT17)** | **0.60** | Confirmed via real exhibition footage — see results below |

The 0.60 threshold was not re-guessed after the MSMT17 switch — it was 
**empirically tested** against real tracking output and held up with a clean 
margin (see Final Results).

---

## Embedding Specification
- Model: `osnet_x1_0` (torchreid)
- Checkpoint: `osnet_x1_0_msmt17.pth` (MSMT17 — finetuned for person re-ID, 
  not the default ImageNet weights)
- Output dimension: 512
- Normalization: L2-normalized (confirmed via `embedding.norm()` ≈ 1.0)
- Input size expected: (256, 128)
- Distance metric for matching: cosine similarity
- Checkpoint is shared manually between team members (not committed to Git — 
  same reasoning as other large binary model files)

## Matching Threshold — Validation History

### Phase 1 — ImageNet checkpoint, check-in pipeline only
- Same-person similarity: ~0.96
- Different-person similarity: ~0.39–0.72 (across 4 test people)
- Threshold used: 0.80

### Phase 2 — Cross-pipeline compatibility check
- Same image, ImageNet weights (both sides, accidental fallback): 
  similarity 1.0000 (misleading — both sides wrong in the same way)
- Same image, MSMT17 vs ImageNet (true mismatch revealed): similarity 0.4535
- Same image, MSMT17 vs MSMT17 (after fix): similarity 1.0000 (confirmed 
  genuine compatibility)

### Phase 3 — MSMT17 checkpoint, regenerated storage
- Different-person similarity: 0.39–0.52 (V1001/V1002/V1003, regenerated)
- Known-visitor match (single test crop): 0.8323

### Phase 4 — Full live-tracking validation (final)
Ran `cv_track/run_reid.py` on `exhibition3.mp4`, containing 3 registered 
visitors plus 1 unregistered person. ByteTrack produced 10 track fragments 
total (occlusion/re-entry causes a single person to split across multiple 
track IDs).

**Known visitors — 7 track fragments, all correctly matched:**
| Visitor | Best Track | Similarity |
|---|---|---|
| V1001 | 1 | 0.8349 |
| V1002 | 7 | 0.7673 |
| V1003 | 2 | 0.8028 |

(V1001 and V1002 also matched correctly on additional fragments: track 10 
at 0.6754, track 15 at 0.6579, track 8 at 0.7651 — confirming consistency 
across multiple crop sets of the same person.)

**Unregistered person — 3 track fragments, all correctly rejected:**
| Track | Similarity | Result |
|---|---|---|
| 3 | 0.5386 | UNKNOWN |
| 6 | 0.5306 | UNKNOWN |
| 18 | 0.5018 | UNKNOWN |

**Result: clean separation.** Highest unknown-person score (0.5386) sits 
~0.12 below the lowest known-visitor score (0.6579). The 0.60 threshold 
sits cleanly in this gap — zero false positives, zero false negatives on 
this test set.

**Final summary output:**
Known Visitors Detected: 3/3
V1001 — Track 1 — Similarity 0.8349
V1002 — Track 7 — Similarity 0.7673
V1003 — Track 2 — Similarity 0.8028



---

## Testing Note
Test videos for the check-in pipeline were recorded as one continuous 
multi-person clip and split using `capture/testing_utils/split_by_person.py` 
to simulate individual check-in captures. `exhibition3.mp4` (used for the 
live tracking validation) was recorded separately, containing the same 3 
registered visitors plus 1 additional unregistered person, specifically to 
test unknown-person rejection under realistic tracking conditions.

---

## Known Limitations
- Similar clothing across different people may reduce the match-confidence 
  gap (not yet stress-tested with deliberately similar outfits)
- Appearance changes (jacket removed/added) may affect same-person matching 
  across sessions
- Track fragmentation (one person split across multiple ByteTrack IDs due 
  to occlusion) is handled by keeping the best-scoring fragment per visitor, 
  but is not itself resolved at the tracking level
- BLE or another secondary identifier recommended as a fallback in low- 
  confidence scenarios, per the original project design

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
pip install ultralytics
pip install yacs gdown
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

### 5. Get the MSMT17 checkpoint
`osnet_x1_0_msmt17.pth` is required by both `embedding/embedding.py` and 
`cv_track/reid.py`. This file is **not committed to Git** (large binary, 
same handling as other model weights) — obtain it from a team member and 
place it at:cv_track/models/osnet_x1_0_msmt17.pth

Both pipelines reference this same file path. If the file is missing, 
torchreid will silently fall back to ImageNet weights with a console 
warning — **watch for this warning**, as it will produce embeddings 
incompatible with the rest of the project without an obvious error.

### 6. Verify full setup
```bash
python -c "import cv2, torch; import sys; sys.path.append(r'path/to/deep-person-reid'); import torchreid; print('OK')"
```

---

## Running the Pipeline

### Check-in / storage pipeline
Run from the project root (`NEXHIBIT/`) for consistent path resolution:
```bash
python capture/read_frames.py
python capture/crop_frames.py
python capture/filter_sharp.py
python embedding/embedding.py
python matching/test_match.py
```
Expected result: a test crop correctly matches its own stored Visitor ID 
with confidence above the 0.80 threshold (check-in pipeline's own 
validation, separate from live tracking).

### Live tracking integration
```bash
python cv_track/run_reid.py
```
Expected result: known registered visitors print as PRESENT with similarity 
scores above 0.60; unregistered people are correctly excluded from the 
summary.