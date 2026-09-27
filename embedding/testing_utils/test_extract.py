import sys
sys.path.append(r"C:\Users\ishik\OneDrive\Desktop\New folder\deep-person-reid")

import torchreid


import torch.nn.functional as F

# Loads osnet_x1_0 with pretrained ImageNet+ReID weights (auto-downloaded on first run)
extractor = torchreid.utils.FeatureExtractor(
    model_name='osnet_x1_0',
    device='cpu'  # use 'cuda' if you have a GPU available
)

# Run on one test image
image_path = 'test_person.jpg'  # any photo of a person, cropped or not
features = extractor(image_path)
features = F.normalize(features, p=2, dim=1)

print(features.shape)   # expect: torch.Size([1, 512])
print(features[0][:5])  # peek at the first 5 numbers of the embedding
print(features[0].norm())