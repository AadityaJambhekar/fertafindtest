# FertaFind content backlog (AI-citation pages)

Section 3 of `FertaFind_AI_SEO_Guide.pdf` calls for source-backed pages that AI
systems can cite. **None are written yet** because the repository does not
currently contain the reliable source material (USDA AMS reports, formula
references, dated figures) required to write them truthfully. This file tracks
the intended pages so they are not forgotten and are never replaced with thin,
unsupported articles.

## Do-not-publish rules

- No page ships without a real, citable source (prefer USDA AMS and clearly dated reports).
- No invented statistics, ratings, savings percentages, or yield/ROI claims.
- Every page must follow the guide's page template (below).

## Required page template (guide §3)

Each page must include:

- A direct answer near the top
- Clear headings
- Real calculation examples
- Useful tables
- USDA sources and report dates
- A "Last updated" date
- Methodology and limitations
- Internal links to **Analyze**, a future **Calculator**, and **Suppliers**

Structured data: `Article` for the page, `BreadcrumbList` for its position, and
`Dataset` only where a genuine dataset is published.

## Backlog

| #   | Working title                        | Primary source needed                    | Notes                                                                  |
| --- | ------------------------------------ | ---------------------------------------- | ---------------------------------------------------------------------- |
| 1   | How to compare fertilizer quotes     | Worked example inputs                    | Ties directly to the Analyze workflow; strongest internal-link target. |
| 2   | Fertilizer cost per acre             | USDA AMS price series + rate assumptions | Needs a transparent worked calculation and unit handling (ac/ha).      |
| 3   | Cost per pound of nitrogen           | USDA AMS N product prices                | Show the formula (price ÷ lb N) with a dated price table.              |
| 4   | How freight changes fertilizer cost  | Real freight/landed-cost example         | Mirrors the site's "landed cost, not sticker price" framing.           |
| 5   | DAP vs. MAP                          | Guaranteed-analysis references           | Composition + use-case comparison table; no product endorsement.       |
| 6   | Urea vs. UAN                         | N source references                      | Handling, volatilization, and cost-per-lb-N comparison.                |
| 7   | USDA AMS fertilizer data methodology | USDA AMS report documentation            | Explains the data behind pages 2–6; supports citations.                |

## Owner action

Provide (or point to) the USDA AMS reports and dated figures for each row.
Until then these remain unpublished; the site ships the technical SEO
foundation, metadata, structured data, analytics, and verification support only.
