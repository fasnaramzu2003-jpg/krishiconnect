
import json
import os
import urllib.error
import urllib.request

URL = "https://api.groq.com/openai/v1/chat/completions"


class AssistantError(Exception):
    pass


def chat(messages, model=None):
    key = os.getenv("GROQ_API_KEY", "").strip()
    if not key:
        raise AssistantError("The AI service is not set up (missing GROQ_API_KEY).")
    model= model or os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    payload = {
        "model": model,
        "messages": messages,
        "temperature": 0.3,
        "max_tokens": 1500,
    }
    if model.startswith("openai/gpt-oss"):
        payload["reasoning_effort"] = "low"
    body = json.dumps(payload).encode("utf-8")

    req = urllib.request.Request(
        URL,
        data=body,
        method="POST",
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "User-Agent": "KrishiConnect/1.0",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as err:
        raise AssistantError(
            f"The AI service returned error {err.code}. Check the key and GROQ_MODEL."
        ) from err
    except (urllib.error.URLError, TimeoutError) as err:
        raise AssistantError("Could not reach the AI service. Check the internet.") from err

    try:
        answer = (data["choices"][0]["message"].get("content") or "").strip()
    except (KeyError, IndexError, TypeError, AttributeError) as err:
        raise AssistantError("The AI service sent an unexpected reply.") from err
    if not answer:
        raise AssistantError("The AI gave an empty answer. Please try again.")
    return answer
