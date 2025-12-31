# patterns.py
import re

def load_patterns(pattern_list):
    """
    Compile regex patterns for faster matching.
    Returns a list of compiled regex objects.
    """
    compiled = []
    for p in pattern_list:
        try:
            compiled.append(re.compile(p, re.IGNORECASE))
        except re.error as e:
            print(f"[WARN] Invalid regex pattern '{p}': {e}")
    return compiled


def match_patterns(patterns, line):
    """
    Check a line against all compiled patterns.
    Returns a list of matched pattern strings.
    """
    matches = []
    for pattern in patterns:
        if pattern.search(line):
            matches.append(pattern.pattern)
    return matches