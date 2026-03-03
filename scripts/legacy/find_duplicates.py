import json
import sys
from collections import Counter

def find_duplicates(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Naive parsing to find duplicate keys at the same level
    # strict=False allows control characters etc.
    # custom decoder to track keys?
    
    # A standard json.load won't show duplicates, it just overwrites.
    # We need to parse line by line or use a custom object_pairs_hook.
    
    issues = []
    
    def dict_raise_on_duplicates(ordered_pairs):
        count = Counter(k for k, v in ordered_pairs)
        for key, c in count.items():
            if c > 1:
                issues.append(key)
        return dict(ordered_pairs)

    try:
        json.loads(content, object_pairs_hook=dict_raise_on_duplicates)
    except Exception as e:
        print(f"Error parsing {filepath}: {e}")
        return

    if issues:
        print(f"Duplicate keys found in {filepath}:")
        for issue in issues:
            print(f" - {issue}")
    else:
        print(f"No duplicate keys found in {filepath}")

if __name__ == "__main__":
    for arg in sys.argv[1:]:
        find_duplicates(arg)
