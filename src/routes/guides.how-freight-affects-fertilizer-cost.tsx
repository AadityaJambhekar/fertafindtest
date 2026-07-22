import { createFileRoute } from "@tanstack/react-router";
import { ContentPageLayout } from "@/components/content-page";
import { getContentPage, contentRouteHead } from "@/lib/content";

const PAGE = getContentPage("/guides/how-freight-affects-fertilizer-cost")!;

export const Route = createFileRoute(
  "/guides/how-freight-affects-fertilizer-cost",
)({
  head: () => contentRouteHead(PAGE),
  component: Page,
});

function Page() {
  return (
    <ContentPageLayout
      page={PAGE}
      answer={
        <>
          The number that decides which quote is cheapest is the{" "}
          <strong>delivered (landed) cost</strong> — the price at the plant plus
          freight to your farm. Freight per ton can flip the ranking, so always
          compare delivered prices, not plant prices.
        </>
      }
      cta={
        <>
          Freight buried in the fine print? FertaFind compares your quotes on
          delivered cost.
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
        {
          label: "How FertaFind uses public USDA data",
          href: "/methodology/usda-ams-fertilizer-data",
        },
        { label: "Analyze your quotes", href: "/analyze" },
      ]}
    >
      <h2>FOB price vs delivered price</h2>
      <p>
        A quote priced <strong>FOB</strong> is the price at the plant or
        terminal — before it moves. The <strong>delivered</strong> price is what
        lands at your farm:
      </p>
      <span className="formula">
        delivered price per ton = FOB price per ton + freight per ton
      </span>
      <p>
        When one quote is FOB and another is delivered, put both on a delivered
        basis before you compare.
      </p>

      <h2>Freight matters more for low-analysis products</h2>
      <p>
        Freight is charged by weight, but you buy nutrients. A ton of a
        low-grade product carries fewer pounds of nutrient than a ton of a
        high-grade product, so the same freight per ton is a bigger add-on per
        pound of nutrient. The lower the analysis and the farther the haul, the
        more freight moves the real cost.
      </p>

      <h2>Worked example</h2>
      <p>
        Two suppliers quoting urea (46-0-0, 920 lb N per ton). Figures are{" "}
        <strong>illustrative, not quoted prices</strong>.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col"></th>
              <th scope="col">Nearby supplier</th>
              <th scope="col">Distant supplier</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>FOB price</td>
              <td>$500 / ton</td>
              <td>$485 / ton</td>
            </tr>
            <tr>
              <td>Freight to farm</td>
              <td>+ $15 / ton</td>
              <td>+ $45 / ton</td>
            </tr>
            <tr>
              <td>Delivered price</td>
              <td>$515 / ton</td>
              <td>$530 / ton</td>
            </tr>
            <tr>
              <td>
                <strong>Cost per lb of N</strong>
              </td>
              <td>
                <strong>$0.56</strong>
              </td>
              <td>
                <strong>$0.58</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        The distant supplier had the lower FOB price, but freight made the
        nearby supplier cheaper on delivered nitrogen. Only the delivered
        comparison shows this.
      </p>

      <h2>Where freight shows up</h2>
      <p>
        Freight is usually on the quote or available from the supplier. Public
        delivered- and production-cost references, such as{" "}
        <a href="/methodology/usda-ams-fertilizer-data">USDA market reports</a>,
        also report prices on a delivered basis in some regions, which is useful
        context.
      </p>

      <h2>Limitations</h2>
      <p>
        Freight changes with distance, load size, season, and fuel prices, and a
        spot rate today may not hold next week. Use a firm delivered quote for
        your own decision, and treat any published figure as a reference point
        rather than your price.
      </p>
    </ContentPageLayout>
  );
}
