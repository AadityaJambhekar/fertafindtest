import { createFileRoute } from "@tanstack/react-router";
import { ContentPageLayout } from "@/components/content-page";
import { getContentPage, contentRouteHead } from "@/lib/content";

const PAGE = getContentPage("/methodology/usda-ams-fertilizer-data")!;

export const Route = createFileRoute("/$locale/methodology/usda-ams-fertilizer-data")({
  head: () => contentRouteHead(PAGE),
  component: Page,
});

function Page() {
  return (
    <ContentPageLayout
      page={PAGE}
      answer={
        <>
          FertaFind grounds its price explanations in <strong>public, verifiable</strong> USDA
          references — chiefly <strong>USDA AMS Market News</strong> (regional production-cost
          reports that include fertilizer prices) and{" "}
          <strong>USDA ERS Fertilizer Use and Price</strong> (annual national and state
          use-and-price data) — alongside the actual grades and prices on the quotes you upload. We
          do not publish our own market index, and your quotes are the authoritative inputs to your
          comparison.
        </>
      }
      cta={<>Your own quotes are the numbers that decide — upload them to see the comparison.</>}
      related={[
        {
          label: "How freight affects fertilizer cost",
          href: "/guides/how-freight-affects-fertilizer-cost",
        },
        {
          label: "How to compare fertilizer quotes",
          href: "/guides/how-to-compare-fertilizer-quotes",
        },
        { label: "Analyze your quotes", href: "/analyze" },
        { label: "Terms", href: "/terms" },
      ]}
    >
      <h2>The public USDA references we rely on</h2>
      <h3>USDA AMS Market News</h3>
      <p>
        The USDA Agricultural Marketing Service publishes free market reports under a voluntary
        price-reporting program. Its regional production-cost reports summarize input prices —
        including synthetic and organic fertilizers — and are issued on a bi-weekly or monthly
        cycle. Prices are typically shown as a low/high range and a simple average for a reporting
        period. These reports are useful for understanding the general level and direction of
        fertilizer prices in a region.
      </p>
      <h3>USDA ERS Fertilizer Use and Price</h3>
      <p>
        The USDA Economic Research Service compiles a long-running dataset of fertilizer consumption
        by nutrient and product, together with farm prices and wholesale price indices, at the
        national and state level. It draws on sources such as the Association of American Plant Food
        Control Officials, The Fertilizer Institute, and USDA&rsquo;s National Agricultural
        Statistics Service. It is updated on an annual cycle, and some individual series end in
        earlier years, so it is best treated as historical context rather than a current quote.
      </p>

      <h2>How we use them</h2>
      <p>
        We use these references to explain and sanity-check the relationships behind a comparison —
        for example, that products with a lower analysis carry more freight per pound of nutrient,
        or how nitrogen sources line up on cost per pound of N. The numbers that drive <em>your</em>{" "}
        result are the grades and prices on the quotes you upload, not a published average.
      </p>

      <h2>What we do not do</h2>
      <ul>
        <li>We do not publish a proprietary price index or present one as official.</li>
        <li>We do not claim a public average is the price available to you — your quote is.</li>
        <li>We do not invent figures. Illustrative examples in our guides are labeled as such.</li>
      </ul>

      <h2>Limitations</h2>
      <p>
        Public data is regional and time-lagged: AMS reports cover a reporting period and a region,
        and the ERS dataset is annual and partly historical. Neither is a live, farm-specific price.
        Fertilizer prices also move with season, energy costs, and logistics. Use these sources for
        context, and confirm your own decision with a firm delivered quote for your location. See
        our <a href="/terms">Terms</a> for how recommendations and comparisons are intended to be
        used.
      </p>
    </ContentPageLayout>
  );
}
