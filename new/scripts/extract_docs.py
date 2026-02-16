import docx
import sys
import os

def extract_text(file_path):
    if not os.path.exists(file_path):
        return f"Error: File {file_path} not found."
    try:
        doc = docx.Document(file_path)
        full_text = []
        for para in doc.paragraphs:
            full_text.append(para.text)
        return '\n'.join(full_text)
    except Exception as e:
        return f"Error reading {file_path}: {str(e)}"

if __name__ == "__main__":
    files = [
        r"d:\desarrollos\ABDElevators\documentación\03\conversación perplexity - evolucion a sistema genérico.docx",
        r"d:\desarrollos\ABDElevators\documentación\04\4 - nuevo enfoque.docx"
    ]
    for f in files:
        print(f"--- CONTENT OF {os.path.basename(f)} ---")
        print(extract_text(f))
        print("\n" + "="*50 + "\n")
