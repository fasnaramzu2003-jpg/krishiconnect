
import math
import re
from collections import Counter

from .models import KnowledgeDocument

NOTES_RULE = (
    "Reference notes follow. Base your answer on them when they are relevant and "
    "mention the note number like [1]. Do not add doses or numbers that are not in "
    "the notes."
)
NO_NOTES_RULE = (
    "No verified reference was found for this question. Give only general, cautious "
    "advice and say clearly that it is not from a verified reference."
)

STOPWORDS = {
    "the", "a", "an", "is", "are", "of", "to", "in", "on", "for", "and", "or", "my",
    "me", "i", "it", "how", "what", "when", "which", "do", "does", "can", "should",
    "with", "at", "by", "be", "this", "that", "from", "as", "about",
}
SPLIT = re.compile(r"[\s.,;:!?()\[\]{}\"'/\\|<>=+*&^%$#@~`-]+")


def tokenize(text):
    return [t for t in SPLIT.split(text.lower()) if len(t) > 1 and t not in STOPWORDS]


def make_chunks(text, limit=90):
    pieces = []
    for para in re.split(r"\n\s*\n", text):
        words = para.split()
        for i in range(0, len(words), limit):
            pieces.append(" ".join(words[i:i + limit]))
    chunks, current = [], ""
    for piece in pieces:
        if current and len((current + " " + piece).split()) > limit:
            chunks.append(current)
            current = piece
        else:
            current = (current + " " + piece).strip()
    if current:
        chunks.append(current)
    return chunks


def search(question, top_k=3):
    terms = set(tokenize(question))
    if not terms:
        return []
    entries = []
    for doc in KnowledgeDocument.objects.filter(is_published=True):
        for text in make_chunks(doc.content):
            entries.append((doc, text, Counter(tokenize(text))))
    if not entries:
        return []

    n = len(entries)
    avg = (sum(sum(c.values()) for _, _, c in entries) / n) or 1
    df = Counter()
    for _, _, counts in entries:
        for t in terms:
            if t in counts:
                df[t] += 1

    needed = min(2, len(terms))
    scored = []
    for doc, text, counts in entries:
        length = sum(counts.values())
        matched = [t for t in terms if counts.get(t)]
        if len(matched) < needed:
            continue
        score = 0.0
        for t in matched:
            tf = counts[t]
            idf = math.log(1 + (n - df[t] + 0.5) / (df[t] + 0.5))
            score += idf * tf * 2.2 / (tf + 1.2 * (0.25 + 0.75 * length / avg))
        scored.append((score, doc, text))
    scored.sort(key=lambda item: item[0], reverse=True)
    return [{"doc": d, "text": t} for _, d, t in scored[:top_k]]


def format_notes(hits):
    return "\n".join(
        f"[{i}] ({h['doc'].source_name}) {h['text']}" for i, h in enumerate(hits, 1)
    )


def sources_of(hits):
    seen, result = set(), []
    for h in hits:
        doc = h["doc"]
        if doc.id in seen:
            continue
        seen.add(doc.id)
        result.append(
            {"title": doc.title, "source_name": doc.source_name, "source_url": doc.source_url}
        )
    return result
