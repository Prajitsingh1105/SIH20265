import re
from datetime import datetime
from typing import Dict, Any, Optional

INDIAN_BANKS = [
    {"code": "SBI", "name": "State Bank of India", "keywords": ["state bank of india", "sbi", "state bank"]},
    {"code": "PNB", "name": "Punjab National Bank", "keywords": ["punjab national bank", "pnb"]},
    {"code": "HDFC", "name": "HDFC Bank", "keywords": ["hdfc bank", "hdfc"]},
    {"code": "CANARA", "name": "Canara Bank", "keywords": ["canara bank", "canara"]},
    {"code": "BOB", "name": "Bank of Baroda", "keywords": ["bank of baroda", "baroda", "bob"]},
]

def parse_fdr_text(text: str) -> Dict[str, Any]:
    """
    Parses OCR raw text and extracts key FDR fields:
    - FDR Number
    - Bank Name & Code
    - Principal Amount
    - Issue Date
    - Maturity Date
    - Validity in Months
    """
    normalized = text.lower()
    extracted: Dict[str, Any] = {
        "fdrNumber": None,
        "bankCode": None,
        "bankName": None,
        "branch": None,
        "amount": None,
        "issueDate": None,
        "maturityDate": None,
        "validityMonths": 36,
        "lienPledged": "Member Secretary, AICTE, New Delhi",
        "confidence": 0.85,
        "rawText": text[:500],
    }

    # 1. Identify Bank
    for bank in INDIAN_BANKS:
        for kw in bank["keywords"]:
            if kw in normalized:
                extracted["bankCode"] = bank["code"]
                extracted["bankName"] = bank["name"]
                break
        if extracted["bankCode"]:
            break

    # 2. Extract FDR / Receipt / Account Number
    # Common formats: FDR-SBI-2024-..., No. 12345678, A/C: ..., FDR No: ...
    fdr_patterns = [
        r'(?:fdr\s*(?:no\.?|num(?:ber)?|#)?\s*[:\-]?\s*)([A-Z0-9\-\/]{6,25})',
        r'(?:receipt\s*(?:no\.?|#)?\s*[:\-]?\s*)([A-Z0-9\-\/]{6,25})',
        r'(?:fixed\s*deposit\s*(?:no\.?|#)?\s*[:\-]?\s*)([A-Z0-9\-\/]{6,25})',
        r'([A-Z]{3,4}[\-][A-Z0-9]{3,5}[\-][0-9]{4,8})',
    ]
    for pattern in fdr_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            extracted["fdrNumber"] = match.group(1).strip().upper()
            break

    # 3. Extract Amount (e.g., Rs. 15,00,000 / INR 25,00,000 / ₹ 10,00,000 / 500000)
    amount_patterns = [
        r'(?:rs\.?|inr|₹|amount|sum\s*of)\s*[:\-]?\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{2})?)',
        r'([0-9]{1,2}(?:,[0-9]{2})*,[0-9]{3}(?:\.[0-9]{2})?)',
        r'(?:principal|deposit\s*amount)\s*[:\-]?\s*([0-9]+(?:\.[0-9]{2})?)',
    ]
    for pattern in amount_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            raw_amt = match.group(1).replace(',', '')
            try:
                amt = float(raw_amt)
                if amt >= 10000: # Filter out trivial numbers
                    extracted["amount"] = amt
                    break
            except ValueError:
                pass

    # 4. Extract Dates (DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, DD Month YYYY)
    date_patterns = re.findall(r'\b([0-3]?[0-9][\/\-][0-1]?[0-9][\/\-](?:20)?[1-3][0-9])\b', text)
    extracted_dates = []

    for d_str in date_patterns:
        clean = d_str.replace('-', '/')
        parts = clean.split('/')
        if len(parts) == 3:
            day, month, year = parts
            if len(year) == 2:
                year = f"20{year}"
            try:
                dt = datetime(int(year), int(month), int(day))
                extracted_dates.append(dt)
            except ValueError:
                pass

    if len(extracted_dates) >= 2:
        extracted_dates.sort()
        extracted["issueDate"] = extracted_dates[0].strftime("%Y-%m-%d")
        extracted["maturityDate"] = extracted_dates[-1].strftime("%Y-%m-%d")
        diff_days = (extracted_dates[-1] - extracted_dates[0]).days
        extracted["validityMonths"] = max(12, round(diff_days / 30))
    elif len(extracted_dates) == 1:
        extracted["issueDate"] = extracted_dates[0].strftime("%Y-%m-%d")

    # 5. Extract Branch
    branch_match = re.search(r'(?:branch|br\.?)\s*[:\-]?\s*([A-Za-z\s,]{4,30})', text, re.IGNORECASE)
    if branch_match:
        extracted["branch"] = branch_match.group(1).strip()

    return extracted
