# -*- coding: utf-8 -*-
import json

with open(r"C:\Users\Asus\.gemini\antigravity\scratch\staff-management-system\data.json", "r", encoding="utf-8") as f:
    data = json.load(f)

js_content = f"// System Seed Data (213 Records)\nconst INITIAL_STAFF_DATA = {json.dumps(data, ensure_ascii=False, indent=2)};\n"

with open(r"C:\Users\Asus\.gemini\antigravity\scratch\staff-management-system\data.js", "w", encoding="utf-8") as out:
    out.write(js_content)

print("data.js generated successfully!")
