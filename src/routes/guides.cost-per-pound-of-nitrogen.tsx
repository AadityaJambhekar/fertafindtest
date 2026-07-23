import { createFileRoute } from "@tanstack/react-router";
import { ContentPageLayout } from "@/components/content-page";
import { getContentPage, contentRouteHead } from "@/lib/content";

const PAGE = getContentPage("/guides/cost-per-pound-of-nitrogen")!;

export const Route = createFileRoute("/guides/cost-per-pound-of-nitrogen")({
  head: () => contentRouteHead(PAGE),
  component: Page,
});

function Page() {
  return (
    <ContentPageLayout
      page={PAGE}
      answer={
        <>
          Cost per pound of nitrogen = <strong>delivered price per ton ÷ (2,000 × %N ÷ 100)</strong>
          . Because nitrogen fertilizers carry very different amounts of N, this is the only fair
          way to compare their prices. Urea (46% N) holds 920 lb of N per ton.
        </>
      }
      cta={
        <>
          Comparing nitrogen sources? FertaFind lines your quotes up on cost per pound of delivered
          N.
        </>
      }
      related={[
        { label: "Urea vs UAN", href: "/compare/urea-vs-uan" },
        {
          label: "How to compare fertilizer quotes",
          href: "/guides/how-to-compare-fertilizer-quotes",
        },
        {
          label: "How freight affects fertilizer cost",
          href: "/guides/how-freight-affects-fertilizer-cost",
        },
        { label: "Analyze your quotes", href: "/analyze" },
      ]}
    >
      <h2>The formula</h2>
      <span className="formula">
        cost per lb of N = delivered price per ton ÷ pounds of N per ton
        <br />
        pounds of N per ton = 2,000 × (percent N ÷ 100)
      </span>

      <h2>Nitrogen content of common sources</h2>
      <p>
        The percent N comes from each product&rsquo;s grade. Pounds of N per ton is just 2,000 ×
        that percentage. These are standard label analyses: Michigan State University Extension
        reports the same figures, including anhydrous ammonia at 82% N and ammonium sulfate at 21% N
        with 24% sulfur (see Sources below).
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Source</th>
              <th scope="col">Grade</th>
              <th scope="col">% N</th>
              <th scope="col">lb N / ton</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Anhydrous ammonia</td>
              <td>82-0-0</td>
              <td>82</td>
              <td>1,640</td>
            </tr>
            <tr>
              <td>Urea</td>
              <td>46-0-0</td>
              <td>46</td>
              <td>920</td>
            </tr>
            <tr>
              <td>UAN (higher grade)</td>
              <td>32-0-0</td>
              <td>32</td>
              <td>640</td>
            </tr>
            <tr>
              <td>UAN (lower grade)</td>
              <td>28-0-0</td>
              <td>28</td>
              <td>560</td>
            </tr>
            <tr>
              <td>Ammonium sulfate</td>
              <td>21-0-0 (≈24% S)</td>
              <td>21</td>
              <td>420</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Liquids priced by the gallon</h2>
      <p>
        UAN is sometimes priced per gallon rather than per ton. To use the formula you need the
        product&rsquo;s weight per gallon (ask your supplier or read the label). University of
        Minnesota Extension reports that a gallon of 28% UAN weighs about 10.7 lb and carries about
        3 lb of N, and a gallon of 32% UAN about 3.5 lb of N. Confirm the exact weight for the
        product you buy.
      </p>

      <h2>Worked comparison</h2>
      <p>
        Illustrative delivered prices — <strong>not quoted prices</strong> — turned into cost per
        pound of N:
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Source</th>
              <th scope="col">Delivered price</th>
              <th scope="col">lb N / ton</th>
              <th scope="col">Cost per lb N</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Urea (46-0-0)</td>
              <td>$500 / ton</td>
              <td>920</td>
              <td>$0.54</td>
            </tr>
            <tr>
              <td>UAN (32-0-0)</td>
              <td>$400 / ton</td>
              <td>640</td>
              <td>$0.63</td>
            </tr>
            <tr>
              <td>Ammonium sulfate (21-0-0)</td>
              <td>$360 / ton</td>
              <td>420</td>
              <td>$0.86</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Cost per pound of N is not the whole story</h2>
      <p>
        These sources are not interchangeable. Ammonium sulfate looks expensive per pound of N here,
        but it also supplies sulfur, so its nitrogen cost overstates its total value where sulfur is
        needed. Sources also differ in handling and in how much nitrogen can be lost to the air if
        surface-applied without incorporation. See <a href="/compare/urea-vs-uan">urea vs UAN</a>{" "}
        for those differences. Which source fits your field is an agronomic decision, not a price
        decision.
      </p>
    </ContentPageLayout>
  );
}
