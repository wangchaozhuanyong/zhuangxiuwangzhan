import { Link } from "react-router-dom";
import Reveal from "@/components/Reveal";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";

const Privacy = () => {
  return (
    <main className="pt-16">
      <PageMeta
        title="Privacy Policy | FLASH CAST SDN. BHD."
        description="FLASH CAST SDN. BHD. privacy policy. How we collect, use, and protect your personal information."
        keywords="privacy policy, FLASH CAST, data protection Malaysia"
        canonicalPath="/privacy"
      />
      <JsonLdBreadcrumb items={[{ name: "Home", url: "/" }, { name: "Privacy Policy", url: "/privacy" }]} />

      <section className="section-padding bg-background">
        <div className="container-narrow max-w-3xl">
          <Reveal>
            <div className="accent-line mb-4 mx-auto" />
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2 text-center">Privacy Policy</h1>
            <p className="text-muted-foreground text-sm text-center mb-10">Last updated: March 2026</p>
          </Reveal>

          <Reveal>
            <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
              <section>
                <h2 className="font-display text-xl font-bold mb-3">1. Information We Collect</h2>
                <p className="text-muted-foreground leading-relaxed">
                  When you contact us via our website, WhatsApp, phone, or email, we may collect the following information:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
                  <li>Name and contact details (phone number, email address)</li>
                  <li>Property address and project details</li>
                  <li>Budget preferences and renovation requirements</li>
                  <li>Photos or documents you share with us</li>
                  <li>Website usage data (cookies, analytics)</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl font-bold mb-3">2. How We Use Your Information</h2>
                <p className="text-muted-foreground leading-relaxed">We use your personal information to:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
                  <li>Respond to your enquiries and provide quotations</li>
                  <li>Schedule site measurements and consultations</li>
                  <li>Manage and deliver renovation projects</li>
                  <li>Send project updates and relevant communications</li>
                  <li>Improve our website and services</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl font-bold mb-3">3. Data Protection</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We take reasonable measures to protect your personal data from unauthorized access, alteration, or disclosure. Your information is stored securely and only accessible by authorized personnel involved in your project.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-bold mb-3">4. Third-Party Sharing</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We do not sell or rent your personal information to third parties. We may share your information with trusted partners (e.g., material suppliers, subcontractors) only as necessary to deliver your renovation project, and with your consent.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-bold mb-3">5. Cookies</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Our website may use cookies and similar technologies to improve user experience and analyze website traffic. You can control cookie settings through your browser preferences.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-bold mb-3">6. Your Rights</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Under the Malaysian Personal Data Protection Act 2010 (PDPA), you have the right to access, correct, and request deletion of your personal data. To exercise these rights, please contact us.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-bold mb-3">7. Contact Us</h2>
                <p className="text-muted-foreground leading-relaxed">
                  If you have any questions about this Privacy Policy, please contact us:
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

export default Privacy;
