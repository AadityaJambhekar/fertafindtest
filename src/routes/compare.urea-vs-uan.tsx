import { createFileRoute } from "@tanstack/react-router";
import { ContentPageLayout } from "@/components/content-page";
import { getContentPage, contentRouteHead } from "@/lib/content";

const PAGE = getContentPage("/compare/urea-vs-uan")!;

export const Route = createFileRoute("/compare/urea-vs-uan")({
  head: () => contentRouteHead(PAGE),
  component: Page,
});

function Page() {
  return (
    <ContentPageLayout
      page={PAGE}
      answer={
        <>
          Urea is <strong>46-0-0</strong>, a dry granular product. UAN is a
          liquid, <strong>28-0-0 to 32-0-0</strong>, made from urea and ammonium
          nitrate. Compare them on{" "}
          <strong>delivered cost per pound of nitrogen</strong>. Both can lose
          nitrogen to the air if surface-applied without incorporation, and they
          need different equipment.
        </>
      }
      cta={
        <>
          Choosing between urea and UAN quotes? FertaFind puts them on one
          cost-per-pound-of-N basis.
        </>
      }
      related={[
        {
          label: "Cost per pound of nitrogen",
          href: "/guides/cost-per-pound-of-nitrogen",
        },
        { label: "DAP vs MAP", href: "/compare/dap-vs-map" },
        {
          label: "How to compare fertilizer quotes",
          href: "/guides/how-to-compare-fertilizer-quotes",
        },
        { label: "Analyze your quotes", href: "/analyze" },
      ]}
    >
      <h2>The two forms</h2>
      <p>
        Urea is a solid that is 46% nitrogen, all in the urea form. UAN is a
        liquid blend of urea and ammonium nitrate, sold at grades from 28% to
        32% nitrogen. Because UAN is part urea, the two share some of the same
        behavior in the field.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Product</th>
              <th scope="col">Form</th>
              <th scope="col">Grade</th>
              <th scope="col">% N</th>
              <th scope="col">lb N / ton</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Urea</td>
              <td>Dry granular</td>
              <td>46-0-0</td>
              <td>46</td>
              <td>920</td>
            </tr>
            <tr>
              <td>UAN (higher grade)</td>
              <td>Liquid</td>
              <td>32-0-0</td>
              <td>32</td>
              <td>640</td>
            </tr>
            <tr>
              <td>UAN (lower grade)</td>
              <td>Liquid</td>
              <td>28-0-0</td>
              <td>28</td>
              <td>560</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Compare on cost per pound of nitrogen</h2>
      <p>
        Divide the delivered price by the pounds of nitrogen it contains. For
        liquids priced per gallon, first convert using the product&rsquo;s
        weight per gallon (ask your supplier). Illustrative delivered prices —{" "}
        <strong>not quoted prices</strong>:
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Product</th>
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
          </tbody>
        </table>
      </div>
      <p>
        See{" "}
        <a href="/guides/cost-per-pound-of-nitrogen">
          cost per pound of nitrogen
        </a>{" "}
        for the full method.
      </p>

      <h2>Handling and nitrogen losses</h2>
      <p>These are the differences that price alone will not show:</p>
      <ul>
        <li>
          <strong>Urea</strong> can lose nitrogen to the air (ammonia
          volatilization) if it stays on the soil surface during warm weather;
          University of Minnesota Extension notes that incorporation by tillage
          or about a quarter-inch of rain greatly reduces this loss.
        </li>
        <li>
          <strong>UAN</strong> is only part urea, so its volatilization
          potential is lower than straight urea, but the nitrate portion is
          subject to leaching and denitrification once it is in the soil.
        </li>
        <li>
          <strong>Equipment.</strong> Urea is spread dry; UAN is handled and
          applied as a liquid. The right fit depends on the gear you already
          run.
        </li>
      </ul>

      <h2>Where the choice goes beyond price</h2>
      <p>
        Which nitrogen source and timing suit your field is an agronomic
        decision that depends on your soil, crop, weather, and equipment. This
        page compares the two on price and general handling only — it does not
        recommend a rate or a product.
      </p>
    </ContentPageLayout>
  );
}
