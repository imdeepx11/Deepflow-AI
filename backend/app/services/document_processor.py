import os
import pymupdf as fitz  # PyMuPDF
import docx

class DocumentProcessor:
    @staticmethod
    def extract_text(file_path: str, file_type: str) -> str:
        """
        Extract text content from PDF, DOCX, or TXT files.
        """
        ext = file_type.lower()
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")

        extracted_text = ""
        try:
            if "pdf" in ext or file_path.endswith(".pdf"):
                extracted_text = DocumentProcessor._extract_pdf(file_path)
            elif "docx" in ext or "doc" in ext or file_path.endswith(".docx"):
                extracted_text = DocumentProcessor._extract_docx(file_path)
            elif "txt" in ext or file_path.endswith(".txt"):
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    extracted_text = f.read()
            else:
                # Fallback text reading
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    extracted_text = f.read()
        except Exception as e:
            extracted_text = f"[Error extracting text: {str(e)}]"

        return extracted_text.strip()

    @staticmethod
    def _extract_pdf(file_path: str) -> str:
        doc = fitz.open(file_path)
        text_parts = []
        for page in doc:
            text_parts.append(page.get_text())
        return "\n".join(text_parts)

    @staticmethod
    def _extract_docx(file_path: str) -> str:
        doc = docx.Document(file_path)
        text_parts = []
        for p in doc.paragraphs:
            if p.text:
                text_parts.append(p.text)
        for table in doc.tables:
            for row in table.rows:
                row_text = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                if row_text:
                    text_parts.append(" | ".join(row_text))
        return "\n".join(text_parts)
