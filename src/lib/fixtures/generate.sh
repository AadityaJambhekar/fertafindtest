#!/usr/bin/env bash
# Regenerates the synthetic OOXML quote fixtures used by quote-extraction.test.ts.
#
# These files are SAFE, SYNTHETIC fertilizer quotes — no real customer data. They are built
# with the standard `zip` tool so the extractor is validated against genuine ZIP output (the
# same container Word/Excel produce). Run from the repo root:  bash src/lib/fixtures/generate.sh
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

mk() { mkdir -p "$(dirname "$1")"; cat > "$1"; }
zipdir() { ( cd "$1" && rm -f "$2" && zip -X -r -q "$2" . -x '.*' ) && mv "$1/$2" "$here/$2"; }

# ---------------------------------------------------------------------------
# quote-basic.docx — headings, paragraphs and a product table.
# ---------------------------------------------------------------------------
d="$tmp/docx"; rm -rf "$d"; mkdir -p "$d"
mk "$d/[Content_Types].xml" <<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>
XML
mk "$d/_rels/.rels" <<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>
XML
mk "$d/word/document.xml" <<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>
<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>AgroSul Fertilizantes - Fertilizer Quote</w:t></w:r></w:p>
<w:p><w:r><w:t>Supplier: AgroSul Fertilizantes Ltda</w:t></w:r></w:p>
<w:p><w:r><w:t xml:space="preserve">Delivery: R$ 120.00 per tonne, delivery within 15 days.</w:t></w:r></w:p>
<w:tbl>
<w:tr><w:tc><w:p><w:r><w:t>Product</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>Grade</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>Bag</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>Unit price</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>Rate</w:t></w:r></w:p></w:tc></w:tr>
<w:tr><w:tc><w:p><w:r><w:t>Urea</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>46-0-0</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>50 kg</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>R$ 180.00</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>200 kg/ha</w:t></w:r></w:p></w:tc></w:tr>
<w:tr><w:tc><w:p><w:r><w:t>Nano Urea</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>17-0-0</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>500 ml</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>R$ 45.00</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>2 L/ha</w:t></w:r></w:p></w:tc></w:tr>
</w:tbl>
</w:body></w:document>
XML
zipdir "$d" "quote-basic.docx"

# ---------------------------------------------------------------------------
# empty.docx — a valid document with no readable text.
# ---------------------------------------------------------------------------
d="$tmp/docx-empty"; rm -rf "$d"; mkdir -p "$d"
cp "$tmp/docx/[Content_Types].xml" "$d/[Content_Types].xml"
mkdir -p "$d/_rels"; cp "$tmp/docx/_rels/.rels" "$d/_rels/.rels"
mk "$d/word/document.xml" <<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p/></w:body></w:document>
XML
zipdir "$d" "empty.docx"

# ---------------------------------------------------------------------------
# image-only.docx — a drawing/blip but no text runs.
# ---------------------------------------------------------------------------
d="$tmp/docx-image"; rm -rf "$d"; mkdir -p "$d"
cp "$tmp/docx/[Content_Types].xml" "$d/[Content_Types].xml"
mkdir -p "$d/_rels"; cp "$tmp/docx/_rels/.rels" "$d/_rels/.rels"
mk "$d/word/document.xml" <<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body><w:p><w:r><w:drawing><wp:inline><a:graphic><a:graphicData><a:blip r:embed="rId5"/></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p></w:body></w:document>
XML
zipdir "$d" "image-only.docx"

# ---------------------------------------------------------------------------
# quote-multisheet.xlsx — two sheets, headers, numbers, a formula (cached value).
# ---------------------------------------------------------------------------
x="$tmp/xlsx"; rm -rf "$x"; mkdir -p "$x"
mk "$x/[Content_Types].xml" <<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/></Types>
XML
mk "$x/_rels/.rels" <<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>
XML
mk "$x/xl/workbook.xml" <<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Quote" sheetId="1" r:id="rId1"/><sheet name="Totals" sheetId="2" r:id="rId2"/></sheets></workbook>
XML
mk "$x/xl/_rels/workbook.xml.rels" <<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/></Relationships>
XML
mk "$x/xl/sharedStrings.xml" <<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="15" uniqueCount="15"><si><t>Supplier</t></si><si><t>Product</t></si><si><t>NPK</t></si><si><t>Bag kg</t></si><si><t>Unit price BRL</t></si><si><t>Qty</t></si><si><t>Delivery date</t></si><si><t>AgroSul Fertilizantes</t></si><si><t>Urea</t></si><si><t>46-0-0</t></si><si><t>Nano Urea</t></si><si><t>17-0-0</t></si><si><t>2026-08-01</t></si><si><t>2026-08-05</t></si><si><t>Total BRL</t></si></sst>
XML
mk "$x/xl/worksheets/sheet1.xml" <<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>
<row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c><c r="C1" t="s"><v>2</v></c><c r="D1" t="s"><v>3</v></c><c r="E1" t="s"><v>4</v></c><c r="F1" t="s"><v>5</v></c><c r="G1" t="s"><v>6</v></c></row>
<row r="2"><c r="A2" t="s"><v>7</v></c><c r="B2" t="s"><v>8</v></c><c r="C2" t="s"><v>9</v></c><c r="D2"><v>50</v></c><c r="E2"><v>180</v></c><c r="F2"><v>200</v></c><c r="G2" t="s"><v>12</v></c></row>
<row r="3"><c r="A3" t="s"><v>7</v></c><c r="B3" t="s"><v>10</v></c><c r="C3" t="s"><v>11</v></c><c r="D3"><v>0.5</v></c><c r="E3"><v>45</v></c><c r="F3"><v>2</v></c><c r="G3" t="s"><v>13</v></c></row>
</sheetData></worksheet>
XML
mk "$x/xl/worksheets/sheet2.xml" <<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>
<row r="1"><c r="A1" t="s"><v>14</v></c><c r="B1"><f>180*10</f><v>1800</v></c></row>
</sheetData></worksheet>
XML
zipdir "$x" "quote-multisheet.xlsx"

# ---------------------------------------------------------------------------
# empty.xlsx — one sheet, no rows.
# ---------------------------------------------------------------------------
xe="$tmp/xlsx-empty"; rm -rf "$xe"; mkdir -p "$xe/xl/worksheets" "$xe/xl/_rels" "$xe/_rels"
mk "$xe/[Content_Types].xml" <<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>
XML
mk "$xe/_rels/.rels" <<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>
XML
mk "$xe/xl/workbook.xml" <<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets></workbook>
XML
mk "$xe/xl/_rels/workbook.xml.rels" <<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>
XML
mk "$xe/xl/worksheets/sheet1.xml" <<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData/></worksheet>
XML
zipdir "$xe" "empty.xlsx"

echo "Generated fixtures in $here:"
ls -la "$here"/*.docx "$here"/*.xlsx
