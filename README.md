## Embedding Specification

- Model: osnet_x1_0 (torchreid)
- Output dimension: 512
- Normalization: L2-normalized (confirm via features.norm() ≈ 1.0)
- Input size expected: (256, 128)
- Distance metric for matching: cosine similarity