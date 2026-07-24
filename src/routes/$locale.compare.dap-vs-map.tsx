import { createFileRoute } from "@tanstack/react-router";
import { ContentPageLayout } from "@/components/content-page";
import { getContentPage, contentRouteHead } from "@/lib/content";

const PAGE = getContentPage("/compare/dap-vs-map")!;

export const Route = createFileRoute("/$locale/compare/dap-vs-map")({
  head: () => contentRouteHead(PAGE),
  component: Page,
});

function Page() {
  return (
    <ContentPageLayout
      page={PAGE}
      answer={
        <>
          DAP is <strong>18-46-0</strong> and MAP is <strong>11-52-0</strong>. Both are widely used
          phosphate fertilizers, and university research reports no consistent crop-yield difference
          between them. Compare them on <strong>delivered cost per pound of P₂O₅</strong>, count
          DAP&rsquo;s larger nitrogen content, and let local availability decide the rest.
        </>
      }
      cta={
        <>
          Weighing DAP against MAP quotes? FertaFind compares them on delivered cost per pound of
          phosphate.
        </>
      }
      related={[
        {
          label: "How to compare fertilizer quotes",
          href: "/guides/how-to-compare-fertilizer-quotes",
        },
        {
          label: "Cost per pound of nitrogen",
          href: "/guides/cost-per-pound-of-nitrogen",
        },
        { label: "Urea vs UAN", href: "/compare/urea-vs-uan" },
        { label: "Analyze your quotes", href: "/analyze" },
      ]}
    >
      <h2>What the numbers mean</h2>
      <p>
        The grade is the percent by weight of N-P<sub>2</sub>O<sub>5</sub>-K
        <sub>2</sub>O. Both products supply phosphate plus some nitrogen; neither carries potassium.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Product</th>
              <th scope="col">Grade</th>
              <th scope="col">lb P₂O₅ / ton</th>
              <th scope="col">lb N / ton</th>
              <th scope="col" className="wrap">
                Reaction around the granule
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="wrap">DAP (diammonium phosphate)</td>
              <td>18-46-0</td>
              <td>920</td>
              <td>360</td>
              <td className="wrap">Alkaline (basic) zone</td>
            </tr>
            <tr>
              <td className="wrap">MAP (monoammonium phosphate)</td>
              <td>11-52-0</td>
              <td>1,040</td>
              <td>220</td>
              <td className="wrap">Acidic zone</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>How to compare them on price</h2>
      <p>Put both on cost per pound of phosphate, using the delivered price:</p>
      <span className="formula">cost per lb P₂O₅ = delivered price per ton ÷ lb P₂O₅ per ton</span>
      <p>
        Illustrative delivered prices — <strong>not quoted prices</strong>:
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Product</th>
              <th scope="col">Delivered price</th>
              <th scope="col">lb P₂O₅ / ton</th>
              <th scope="col">Cost per lb P₂O₅</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>DAP (18-46-0)</td>
              <td>$760 / ton</td>
              <td>920</td>
              <td>$0.83</td>
            </tr>
            <tr>
              <td>MAP (11-52-0)</td>
              <td>$800 / ton</td>
              <td>1,040</td>
              <td>$0.77</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Also value the nitrogen you get with each: at these grades a ton of DAP carries 360 lb of N
        versus 220 lb for MAP. If you would otherwise buy that nitrogen separately, credit it when
        you compare.
      </p>

      <h2>Does the pH difference matter?</h2>
      <p>
        MAP creates a more acidic zone around each granule and DAP a more basic one. In theory that
        can favor MAP on high-pH (calcareous) soils, but University of Minnesota Extension reports
        that agronomic and economic data show <strong>no crop-yield differences</strong> between the
        two, and advises choosing on nutrient content, price, and availability. For most growers,
        price and supply — not chemistry — decide.
      </p>

      <h2>What this comparison does not decide</h2>
      <p>
        How much phosphate to apply, whether you need it at all, and how to place it are agronomic
        questions that depend on a soil test and your crop. This page only helps you compare the two
        products on cost.
      </p>
    </ContentPageLayout>
  );
}
