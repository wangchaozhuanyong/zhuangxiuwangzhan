import { Link } from "react-router-dom";
import Reveal from "@/components/Reveal";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";

const Terms = () => {
  return (
    <main className="pt-16">
      <PageMeta
        title="Terms & Conditions | FLASH CAST SDN. BHD."
        description="Terms and conditions for FLASH CAST SDN. BHD. renovation services in Kuala Lumpur, Malaysia."
        keywords="terms and conditions, FLASH CAST, renovation terms Malaysia"
        canonicalPath="/terms"
      />
      <JsonLdBreadcrumb items={[{ name: "Home", url: "/" }, { name: "Terms & Conditions", url: "/terms" }]} />

      <section className="section-padding bg-background">
        <div className="container-narrow max-w-3xl">
          <Reveal>
            <div className="accent-line mb-4 mx-auto" />
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2 text-center">Terms & Conditions</h1>
            <p className="text-muted-foreground text-sm text-center mb-10">Last updated: March 2026</p>
          </Reveal>

          <Reveal>
            <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
              <section>
                <h2 className="font-display text-xl font-bold mb-3">1. General</h2>
                <p className="text-muted-foreground leading-relaxed">
                  These Terms & Conditions govern the use of this website and the renovation services provided by FLASH CAST SDN. BHD. ("the Company"). By using our website or engaging our services, you agree to these terms.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-bold mb-3">2. Quotations & Pricing</h2>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>All quotations are valid for 30 days from the date of issue unless otherwise stated.</li>
                  <li>Prices are based on the scope of work agreed upon. Additional work requested after confirmation may incur extra charges.</li>
                  <li>Quotations are estimates; final pricing may vary based on site conditions and material availability.</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl font-bold mb-3">3. Payment Terms</h2>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>A deposit is required upon confirmation of the project to secure scheduling.</li>
                  <li>Progress payments are due at agreed milestones during the project.</li>
                  <li>Final payment is due upon project completion and handover.</li>
                  <li>Payment methods accepted: bank transfer, online banking, and cheque.</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl font-bold mb-3">4. Project Timeline</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Project timelines are estimated and may be affected by factors including material delivery delays, site access restrictions, weather conditions, or changes requested by the client. We will communicate any anticipated delays promptly.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-bold mb-3">5. Warranty</h2>
                <p className="text-muted-foreground leading-relaxed">
                  FLASH CAST provides a workmanship warranty on completed renovation works. The warranty period and coverage vary by project type and will be specified in your project agreement. Material warranties are subject to the respective manufacturer's terms.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-bold mb-3">6. Client Responsibilities</h2>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>Provide accurate information about the property and project requirements.</li>
                  <li>Ensure site access for workers during agreed working hours.</li>
                  <li>Obtain necessary approvals from building management or authorities where required.</li>
                  <li>Make timely decisions on materials, design, and scope changes.</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl font-bold mb-3">7. Cancellation & Refunds</h2>
                <p className="text-muted-foreground leading-relaxed">
                  If you wish to cancel a confirmed project, please notify us in writing. Cancellation fees may apply depending on the stage of the project. Materials already ordered or custom-fabricated are non-refundable.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-bold mb-3">8. Intellectual Property</h2>
                <p className="text-muted-foreground leading-relaxed">
                  All design concepts, drawings, and content on this website are the intellectual property of FLASH CAST SDN. BHD. and may not be reproduced without written permission.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-bold mb-3">9. Limitation of Liability</h2>
                <p className="text-muted-foreground leading-relaxed">
                  FLASH CAST SDN. BHD. shall not be liable for any indirect, incidental, or consequential damages arising from the use of our services or website. Our total liability is limited to the contract value of the specific project.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-bold mb-3">10. Governing Law</h2>
                <p className="text-muted-foreground leading-relaxed">
                  These terms are governed by the laws of Malaysia. Any disputes shall be subject to the jurisdiction of the courts of Malaysia.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-bold mb-3">11. Contact</h2>
                <p className="text-muted-foreground leading-relaxed">
                  For questions regarding these Terms & Conditions:
                </p>
                <div className="bg-muted rounded-lg p-5 mt-3 text-sm text-muted-foreground space-y-1">
                  <p><strong className="text-foreground">FLASH CAST SDN. BHD.</strong></p>
                  <p>94, Jalan Mega Mendung, Taman United, 58200 Kuala Lumpur</p>
                  <p>Email: info@flashcast.com.my</p>
                  <p>Phone: +60 12-345 6789</p>
                </div>
              </section>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
};

export default Terms;
