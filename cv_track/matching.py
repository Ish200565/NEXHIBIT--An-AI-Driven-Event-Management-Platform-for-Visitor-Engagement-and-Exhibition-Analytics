import torch


def cosine_similarity(embedding1, embedding2):
    """
    Calculate cosine similarity between two normalized embeddings.
    """

    return torch.dot(embedding1, embedding2).item()


def find_best_match(query_embedding, reference_embeddings, threshold=0.80):
    """
    Find the closest reference person.

    reference_embeddings:
        {
            "person1": embedding,
            "person2": embedding,
            "person3": embedding
        }
    """

    best_person = None
    best_score = -1.0

    for person, reference_embedding in reference_embeddings.items():

        score = cosine_similarity(
            query_embedding,
            reference_embedding
        )

        if score > best_score:
            best_score = score
            best_person = person

    # Below threshold = unknown
    if best_score < threshold:
        return "UNKNOWN", best_score

    return best_person, best_score