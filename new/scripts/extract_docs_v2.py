import docx
import sys
import os

def extract_text(file_path):
    try:
        if not os.path.exists(file_path):
            return f"Error: File {file_path} not found."
        doc = docx.Document(file_path)
        full_text = []
        for para in doc.paragraphs:
            full_text.append(para.text)
        return '\n'.join(full_text)
    except Exception as e:
        return f"Error reading {file_path}: {str(e)}"

if __name__ == "__main__":
    file1 = r"d:\desarrollos\ABDElevators\documentación\03\conversación perplexity - evolucion a sistema genérico.docx"
    file2 = r"d:\desarrollos\ABDElevators\documentación\04\4 - nuevo enfoque.docx"
    
    with open("doc03_content.txt", "w", encoding="utf-8") as f:
        f.write(extract_text(file1))
    
    with open("doc04_content.txt", "w", encoding="utf-8") as f:
        f.write(extract_text(file2))

    print("Extraction complete.")
