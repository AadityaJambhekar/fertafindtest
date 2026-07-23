import { createFileRoute } from "@tanstack/react-router";
import { ContentPageLayout } from "@/components/content-page";
import { getContentPage, contentRouteHead } from "@/lib/content";

const PAGE = getContentPage("/guides/fertilizer-cost-per-acre")!;

export const Route = createFileRoute("/guides/fertilizer-cost-per-acre")({
  head: () => contentRouteHead(PAGE),
  component: Page,
});

function Page() {
  return (
    <ContentPageLayout
      page={PAGE}
      answer={
        <>
          Fertilizer cost per acre = <strong>pounds of product applied per acre</strong> ×{" "}
          <strong>price per pound of product</strong> (delivered). If you are priced by the ton,
          cost per acre = (rate in lb per acre ÷ 2,000) × price per ton. The <strong>rate</strong>{" "}
          comes from your agronomic plan — this page only handles the arithmetic of turning a price
          into a per-acre figure.
        </>
      }
      cta={<>Want the whole-field cost for each quote? FertaFind does the per-acre math for you.</>}
      related={[
        {
          label: "How to compare fertilizer quotes",
          href: "/guides/how-to-compare-fertilizer-quotes",
        },
        {
          label: "Cost per pound of nitrogen",
          href: "/guides/cost-per-pound-of-nitrogen",
        },
        {
          label: "How freight affects fertilizer cost",
          href: "/guides/how-freight-affects-fertilizer-cost",
        },
        { label: "Analyze your quotes", href: "/analyze" },
      ]}
    >
      <h2>The basic formula</h2>
      <p>
        Cost per acre depends on two things: how much product you apply per acre, and what the
        product costs per pound delivered.
      </p>
      <span className="formula">
        cost per acre = (rate in lb per acre ÷ 2,000) × delivered price per ton
      </span>

      <h2>If your rate is given in pounds of nutrient</h2>
      <p>
        Agronomic recommendations are often written as pounds of a nutrient per acre (for example,
        pounds of P<sub>2</sub>O<sub>5</sub>). Convert that to pounds of product using the grade,
        then price it:
      </p>
      <span className="formula">
        product lb per acre = nutrient lb per acre ÷ (percent nutrient ÷ 100)
      </span>
      <p>
        Where that nutrient rate comes from — a soil test, a university recommendation, or your
        agronomist — is an agronomic decision. FertaFind does not set rates.
      </p>

      <h2>Worked example</h2>
      <p>
        Applying DAP (18-46-0). Figures are <strong>illustrative, not quoted prices</strong>.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">If you know…</th>
              <th scope="col">Calculation</th>
              <th scope="col">Cost per acre</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>200 lb/ac of DAP at $760/ton</td>
              <td>(200 ÷ 2,000) × $760</td>
              <td>$76.00</td>
            </tr>
            <tr>
              <td>90 lb/ac of P₂O₅ (DAP is 46% P₂O₅) at $760/ton</td>
              <td>90 ÷ 0.46 = 196 lb DAP → (196 ÷ 2,000) × $760</td>
              <td>$74.48</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Do the same for each product and each field so you are comparing whole-field cost, not just
        a headline ton price.
      </p>

      <h2>Include freight, then compare</h2>
      <p>
        Use the <strong>delivered</strong> price per ton in the formula so freight is already
        counted. <a href="/guides/how-freight-affects-fertilizer-cost">Why freight matters</a>. To
        compare different products fairly, also look at{" "}
        <a href="/guides/how-to-compare-fertilizer-quotes">cost per pound of nutrient</a>.
      </p>

      <h2>What this figure does not decide</h2>
      <p>
        A cost-per-acre number tells you what a plan costs — not whether the rate or product is
        right for your soil, crop, and stage. Confirm those with a soil test and a qualified
        agronomist.
      </p>
    </ContentPageLayout>
  );
}
