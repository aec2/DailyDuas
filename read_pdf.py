import PyPDF2

pdf_path = r'C:\Users\Enes\Desktop\DailyDuas\SABAH AKŞAM OKUNACAK DUALAR-1.pdf'
with open(pdf_path, 'rb') as f:
    reader = PyPDF2.PdfReader(f)
    num_pages = len(reader.pages)
    print(f'Total pages: {num_pages}')
    for i, page in enumerate(reader.pages):
        text = page.extract_text()
        print(f'--- PAGE {i+1} ---')
        print(text)
        print()
