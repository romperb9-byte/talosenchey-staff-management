# -*- coding: utf-8 -*-
import csv
import json
import sys

# Force utf-8 for stdout if possible
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

notes_map = {
    6: "ថែមលុយ អ្នកគ្រូ រឿន បុល្ល:វណ្ណីម",
    8: "ខែ៦ ៧ ៨ មិនបានបង្រៀន (១៣២,០០០៛)",
    44: "ពីរពេល",
    46: "ពីរពេល",
    57: "ពីរពេល",
    59: "ពីរពេល",
    68: "ពីរពេល",
    69: "ពីរពេល",
    73: "ពីរពេល",
    79: "ពីរពេល",
    80: "ពីរពេល",
    81: "ពីរពេល",
    83: "ពីរពេល",
    84: "ពីរពេល២ខែគឺខែ ១-២",
    98: "ថែមលុយលោកគ្រូ ជា ធា",
    99: "ថែមលុយ លោក អៀន សារ៉ឹម",
    109: "ពីរពេល",
    111: "ពីរពេល",
    125: "បង្រៀនបន្ថែម",
    132: "បង្រៀនបន្ថែម",
    135: "លំហែខែ ៦ ៧ ៨",
    158: "ពីរពេល",
    172: "ឈប់ខែ ៧ ៨",
    173: "ពីរពេល"
}

schools = [
    # id_start, id_end, school_name, school_code, commune_code, commune_name
    (1, 17, "បឋមតាលោ", "15010906047", "150701", "ឃុំតាលោ"),
    (18, 23, "បឋមព្រៃរោង", "15010905046", "150701", "ឃុំតាលោ"),
    (24, 30, "បឋមបឹងកក់", "15070111048", "150701", "ឃុំតាលោ"),
    (31, 36, "បឋមបោសគរ", "15070116069", "150701", "ឃុំតាលោ"),
    (37, 43, "បឋមបឹងស្តុក", "15070118079", "150701", "ឃុំតាលោ"),
    (44, 46, "បឋមច្រាំងចោត", "15070117078", "150701", "ឃុំតាលោ"),
    (47, 52, "បឋមតាំងគោក", "15010919080", "150701", "ឃុំតាលោ"),
    (53, 63, "បឋមរហាទិល", "15070115063", "150701", "ឃុំតាលោ"),
    (64, 72, "បឋមដំណាក់ត្រប់", "15070107062", "150701", "ឃុំតាលោ"),
    (73, 78, "បឋមបឹងត្នោត", "15070119083", "150701", "ឃុំតាលោ"),
    (79, 81, "បឋមសំសាន្ត", "15070116084", "150701", "ឃុំតាលោ"),
    (82, 86, "បឋមប្រហាល", "15070117070", "150701", "ឃុំតាលោ"),
    (87, 93, "បឋមសិរីគន្ធា", "15070112049", "150701", "ឃុំតាលោ"),
    (94, 99, "បឋមគោករំល", "15010901045", "150701", "ឃុំតាលោ"),
    (100, 108, "បឋមកោះវត្ត", "15010312016", "150701", "ឃុំតាលោ"),
    (109, 111, "បឋមកោះស្វាយ (តាលោ)", "15010302011", "150701", "ឃុំតាលោ"),
    (112, 117, "បឋមជ្រៃក្រឹម", "15040313038", "150702", "ឃុំផ្ទះរុង"),
    (118, 124, "បឋមព្រហស្ថក្បាល", "15040304041", "150702", "ឃុំផ្ទះរុង"),
    (125, 138, "បឋមបត់រំដួល", "15040307013", "150702", "ឃុំផ្ទះរុង"),
    (139, 147, "បឋមជង្រុក", "15040312033", "150702", "ឃុំផ្ទះរុង"),
    (148, 150, "បឋមផ្ទះរុង", "15040309035", "150702", "ឃុំផ្ទះរុង"),
    (151, 157, "បឋមបឹងព្រះពន្លៃ", "15040309032", "150702", "ឃុំផ្ទះរុង"),
    (158, 161, "បឋមកោះស្វាយ (ផ្ទះរុង)", "15040301007", "150702", "ឃុំផ្ទះរុង"),
    (162, 166, "បឋមកណ្តាល", "15040308014", "150702", "ឃុំផ្ទះរុង"),
    (167, 171, "បឋមអំពួច", "15040313051", "150702", "ឃុំផ្ទះរុង"),
    (172, 174, "បឋមស្តុកខ្ទុម", "15040311016", "150702", "ឃុំផ្ទះរុង"),
    (175, 181, "បឋមច្រាបប្រជា", "15040303010", "150702", "ឃុំផ្ទះរុង"),
    (182, 187, "បឋមព្រៃកន្លង់", "15040305011", "150702", "ឃុំផ្ទះរុង"),
    (188, 193, "បឋមក្រញាំ", "15040303009", "150702", "ឃុំផ្ទះរុង"),
    (194, 196, "បឋមដំណាក់កន្សែង", "15040310015", "150702", "ឃុំផ្ទះរុង"),
    (197, 203, "បឋមតាសាស់", "15040302008", "150702", "ឃុំផ្ទះរុង"),
    (204, 213, "បឋមថ្លុកដង្កោ", "15040306012", "150702", "ឃុំផ្ទះរុង")
]

def get_school_info(row_id):
    for start, end, name, code, ccode, cname in schools:
        if start <= row_id <= end:
            return name, code, ccode, cname
    return "", "", "", ""

data = []
with open(r"C:\Users\Asus\.gemini\antigravity\scratch\staff-management-system\raw_data.csv", "r", encoding="utf-8") as f:
    reader = csv.reader(f)
    for row in reader:
        if not row or not row[0].strip().isdigit():
            continue
        row_id = int(row[0].strip())
        raw_staff_id = row[1].strip()
        name_kh = row[2].strip()
        name_en = row[3].strip()
        gender = row[4].strip() # 'ប' or 'ស'
        acc = row[5].strip()
        
        jan = int(row[6]) if row[6].strip().isdigit() else 0
        feb = int(row[7]) if row[7].strip().isdigit() else 0
        mar = int(row[8]) if row[8].strip().isdigit() else 0
        may = int(row[9]) if row[9].strip().isdigit() else 0
        jun = int(row[10]) if row[10].strip().isdigit() else 0
        jul = int(row[11]) if row[11].strip().isdigit() else 0
        aug = int(row[12]) if row[12].strip().isdigit() else 0
        total = int(row[13]) if row[13].strip().isdigit() else (jan+feb+mar+may+jun+jul+aug)
        
        s_name, s_code, c_code, c_name = get_school_info(row_id)
        
        # Staff type classification
        if raw_staff_id == "កិច្ចសន្យា":
            staff_type = "កិច្ចសន្យា" # Contract
            staff_id_display = "កិច្ចសន្យា"
        elif "កិច្ចព្រមព្រៀង" in raw_staff_id:
            staff_type = "គ្រូកិច្ចព្រមព្រៀង"
            staff_id_display = raw_staff_id
        else:
            staff_type = "ក្របខណ្ឌ" # Civil Servant
            staff_id_display = raw_staff_id
            
        note = notes_map.get(row_id, "")
        if len(row) > 16 and row[16].strip() and not s_name:
            s_name = row[16].strip()

        item = {
            "id": row_id,
            "staff_id": staff_id_display,
            "staff_type": staff_type,
            "name_kh": name_kh,
            "name_en": name_en,
            "gender": gender,
            "gender_label": "ស្រី" if gender == "ស" else "ប្រុស",
            "account_number": acc,
            "monthly": {
                "jan": jan,
                "feb": feb,
                "mar": mar,
                "may": may,
                "jun": jun,
                "jul": jul,
                "aug": aug
            },
            "total_allowance": total,
            "commune_code": c_code,
            "commune_name": c_name,
            "school_code": s_code,
            "school_name": s_name,
            "note": note
        }
        data.append(item)

with open(r"C:\Users\Asus\.gemini\antigravity\scratch\staff-management-system\data.json", "w", encoding="utf-8") as out:
    json.dump(data, out, ensure_ascii=False, indent=2)

print(f"SUCCESS: Total records = {len(data)}")
print(f"Total budget = {sum(x['total_allowance'] for x in data):,}")
print(f"Total ក្របខណ្ឌ = {sum(1 for x in data if x['staff_type'] == 'ក្របខណ្ឌ')}")
print(f"Total កិច្ចសន្យា = {sum(1 for x in data if x['staff_type'] == 'កិច្ចសន្យា')}")
