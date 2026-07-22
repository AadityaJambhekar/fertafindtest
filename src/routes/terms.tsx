import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { pageMeta, jsonLdScript, breadcrumbLd } from "@/lib/seo";

export const Route = createFileRoute("/terms")({
  head: () => ({
    ...pageMeta("terms"),
    scripts: [
      jsonLdScript(
        breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Terms", path: "/terms" },
        ]),
      ),
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
          FertaFind terms
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          Terms of use
        </h1>
        <p className="mt-4 text-muted-foreground">Last updated July 18, 2026</p>

        <section className="mt-10 rounded-3xl border border-primary/30 bg-primary/10 p-5 sm:p-6">
          <div className="flex gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <h2 className="font-display text-xl font-semibold text-foreground">
                Partner-only marketplace
              </h2>
              <p className="mt-2 leading-7 text-muted-foreground">
                FertaFind compares and recommends fertilizer products offered by participating
                FertaFind suppliers and partners. It does not search or rank every supplier or
                fertilizer product available in the wider market.
              </p>
            </div>
          </div>
        </section>

        <div className="mt-10 space-y-9 text-[1.02rem] leading-8 text-muted-foreground">
          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground">
              How recommendations work
            </h2>
            <p className="mt-2">
              We use the information you provide—including quotes, crops, location, field details,
              and available soil or weather context—to rank eligible partner products by factors
              such as nutrient fit, stated price, delivery information, and estimated value.
              Commercial relationships with suppliers or partners may benefit FertaFind.
            </p>
          </section>
          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground">
              Decision support only
            </h2>
            <p className="mt-2">
              Results are informational and are not agronomic, financial, legal, or safety advice. A
              recommendation does not guarantee price, stock, delivery, crop performance,
              suitability, savings, or return. Confirm the product label, final quote, availability,
              application plan, and local requirements with the supplier and a qualified adviser.
            </p>
          </section>
          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground">
              Uploaded information
            </h2>
            <p className="mt-2">
              You must provide accurate farm information and have permission to upload each file. Do
              not upload information you are not authorised to share. Supplier listings, prices,
              service areas, and product data must be truthful and current. By selecting the
              acceptance box before analysis, you agree to the version of these Terms shown at that
              time.
            </p>
          </section>
          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground">
              Soil, weather, and irrigation information
            </h2>
            <p className="mt-2">
              A laboratory soil test is optional but recommended. Weather, humidity, modeled surface
              soil temperature, soil moisture, irrigation information, and other environmental data
              may be estimated from third-party sources and may not match conditions within a
              particular field. FertaFind does not perform a physical soil test. Users are
              responsible for confirming recommendations with current field observations, product
              labels, applicable rules, and a qualified agronomist.
            </p>
          </section>
          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground">
              Purchases, delivery, and fulfilment
            </h2>
            <p className="mt-2">
              Unless an order confirmation expressly identifies FertaFind as the seller, fertilizer
              is sold and fulfilled by the participating supplier shown for the order. The supplier
              or its carrier controls stock confirmation, dispatch, delivery scheduling, unloading,
              title and risk transfer, returns, and any delivery-specific charges under the final
              order terms. After purchase, FertaFind is not responsible for an independent
              supplier's or carrier's delay, failed delivery, loss, damage, incorrect handling, or
              other act or omission, except to the extent caused by FertaFind or where applicable
              law does not allow that responsibility to be excluded.
            </p>
            <p className="mt-3">
              Customers must review the supplier's final price, delivery window, access
              requirements, cancellation terms, and refund terms before ordering, and should contact
              the supplier first about fulfilment problems. Nothing in these Terms limits any
              statutory cancellation, refund, consumer-protection, product-liability, or other right
              that cannot lawfully be waived. If FertaFind makes a specific delivery promise or
              applicable law assigns FertaFind responsibility, that promise or law will control.
            </p>
          </section>
          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground">
              Service availability
            </h2>
            <p className="mt-2">
              Analyses may be incomplete or unavailable because of unclear files, missing
              information, third-party services, partner coverage, or technical limits. We may
              review, change, suspend, or remove listings, recommendations, or features where
              reasonably necessary.
            </p>
          </section>
          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground">
              Changes and contact
            </h2>
            <p className="mt-2">
              We may update these terms as the service develops. Questions can be sent to{" "}
              <a
                href="mailto:fertafind@gmail.com"
                className="font-semibold text-primary hover:underline"
              >
                fertafind@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
