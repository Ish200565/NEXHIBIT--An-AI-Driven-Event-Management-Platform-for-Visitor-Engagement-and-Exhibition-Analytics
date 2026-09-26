import torch
import torchreid


class ReIDExtractor:

    def __init__(self, device="cpu"):

        self.extractor = torchreid.utils.FeatureExtractor(
    model_name="osnet_x1_0",
    model_path="models/osnet_x1_0_msmt17.pth",
    device=device
)

    def get_embedding(self, image_paths):
        """
        image_paths = list of image file paths

        Returns:
            normalized 512-dimensional embedding
        """

        features = self.extractor(image_paths)

        # Average the embeddings of the best crops
        avg_embedding = features.mean(dim=0)

        # L2 normalize
        embedding = torch.nn.functional.normalize(
            avg_embedding,
            p=2,
            dim=0
        )

        return embedding