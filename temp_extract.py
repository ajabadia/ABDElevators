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
    file_path = r"d:\desarrollos\ABDElevators\Documentación\05\05 rag agentico.docx"
    content = extract_text(file_path)
    with open("extracted_content_rag_agentico.txt", "w", encoding="utf-8") as f:
        f.write(content)
    print("Extraction successful.")
