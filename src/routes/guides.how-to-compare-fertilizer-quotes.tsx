import { createFileRoute } from "@tanstack/react-router";
import { ContentPageLayout } from "@/components/content-page";
import { getContentPage, contentRouteHead } from "@/lib/content";

const PAGE = getContentPage("/guides/how-to-compare-fertilizer-quotes")!;

export const Route = createFileRoute("/guides/how-to-compare-fertilizer-quotes")({
  head: () => contentRouteHead(PAGE),
  component: Page,
});

function Page() {
  return (
    <ContentPageLayout
      page={PAGE}
      answer={
        <>
          Put every quote on the <strong>same basis</strong> before you compare it: the{" "}
          <strong>delivered cost per pound of the actual nutrient</strong> you are buying. Quotes
          differ in grade, pack size, and freight, so the sticker price alone can point you to the
          wrong choice.
        </>
      }
      cta={
        <>
          Skip the arithmetic: FertaFind converts your quotes to delivered cost per pound of
          nutrient.
        </>
      }
      related={[
        {
          label: "Cost per pound of nitrogen",
          href: "/guides/cost-per-pound-of-nitrogen",
        },
        {
          label: "Fertilizer cost per acre",
          href: "/guides/fertilizer-cost-per-acre",
        },
        {
          label: "How freight affects fertilizer cost",
          href: "/guides/how-freight-affects-fertilizer-cost",
        },
        { label: "How FertaFind works", href: "/#how" },
      ]}
    >
      <h2>Why two quotes rarely compare directly</h2>
      <p>Three things usually differ between quotes, and each one changes the real cost:</p>
      <ul>
        <li>
          <strong>Grade (analysis).</strong> The three numbers on the label — N-P<sub>2</sub>O
          <sub>5</sub>-K<sub>2</sub>O — are the percent by weight of nitrogen, phosphate, and
          potash. A higher grade means more nutrient per ton.
        </li>
        <li>
          <strong>Pack or unit size.</strong> One quote may be per ton, another per bag, and a
          liquid per gallon. You cannot compare a per-bag price to a per-ton price directly.
        </li>
        <li>
          <strong>Freight terms.</strong> A price at the plant (FOB) is not what lands on your farm.
          Delivery can move a &ldquo;cheaper&rdquo; quote above a dearer one.
        </li>
      </ul>

      <h2>Step 1 — Find the nutrient you are actually paying for</h2>
      <p>
        Convert the grade into pounds of nutrient in the unit you are quoted. For a
        priced-by-the-ton product:
      </p>
      <span className="formula">pounds of nutrient per ton = 2,000 × (percent nutrient ÷ 100)</span>
      <p>
        Example: urea is 46-0-0, so a ton holds 2,000 × 0.46 = <strong>920 lb of N</strong>. DAP is
        18-46-0, so a ton holds 920 lb of P<sub>2</sub>O<sub>5</sub> and 360 lb of N.
      </p>

      <h2>Step 2 — Convert to cost per pound of nutrient</h2>
      <span className="formula">
        cost per pound of nutrient = price per unit ÷ pounds of nutrient per unit
      </span>
      <p>
        Do this for the nutrient the quote is really about (nitrogen for urea and UAN; phosphate for
        DAP and MAP). Now the quotes are on one scale.
      </p>

      <h2>Step 3 — Use the delivered price, not the plant price</h2>
      <p>
        Freight is part of the cost of getting a nutrient to your field, so compare the{" "}
        <strong>landed</strong> (delivered) price. If a quote is FOB the plant, add the freight per
        ton before you divide.{" "}
        <a href="/guides/how-freight-affects-fertilizer-cost">
          See how freight changes the ranking
        </a>
        .
      </p>

      <h2>Worked example</h2>
      <p>
        Two quotes for urea (46-0-0). The figures below are{" "}
        <strong>illustrative, not quoted prices</strong>.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Step</th>
              <th scope="col">Quote A</th>
              <th scope="col">Quote B</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Price basis</td>
              <td>$520 / ton, delivered</td>
              <td>$498 / ton at plant</td>
            </tr>
            <tr>
              <td>Freight to farm</td>
              <td>included</td>
              <td>+ $35 / ton</td>
            </tr>
            <tr>
              <td>Delivered price</td>
              <td>$520 / ton</td>
              <td>$533 / ton</td>
            </tr>
            <tr>
              <td>Pounds of N per ton</td>
              <td>920</td>
              <td>920</td>
            </tr>
            <tr>
              <td>
                <strong>Cost per lb of N</strong>
              </td>
              <td>
                <strong>$0.57</strong>
              </td>
              <td>
                <strong>$0.58</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Quote B looked cheaper at the plant, but once freight is included it is the more expensive
        nitrogen. Comparing on cost per pound of delivered nutrient makes that visible.
      </p>

      <h2>A quick checklist</h2>
      <ul>
        <li>Write down each quote&rsquo;s grade, unit, and whether freight is included.</li>
        <li>Convert every quote to cost per pound of the nutrient in question.</li>
        <li>Use the delivered price so freight is counted.</li>
        <li>Only then compare — and remember price is just one input to a good decision.</li>
      </ul>
      <p>
        FertaFind does these conversions for you. <a href="/analyze">Upload your quotes</a> to see
        them side by side on one cost-based footing.
      </p>
    </ContentPageLayout>
  );
}
