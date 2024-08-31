/* eslint-disable react/no-unescaped-entities -- keeping things simple */
import React, { type ReactNode } from 'react';
import { type Metadata } from 'next';

export const metadata: Metadata = {
  title: 'adsViewer.io - Terms & Conditions',
};

function SupportPage(): ReactNode {
  return (
    <div className="flex w-full p-20 pt-40">
      <section className="text-justify">
        <h1>Terms of Service for adsviewer.io</h1>

        <p>
          <strong>Last Updated:</strong> 2023-12-06
        </p>
        <br />
        <p>
          Welcome to adsviewer.io! These Terms of Service ("Terms") govern your access to and use of adsviewer.io ("we,"
          "our," or "us") services, including the adsviewer.io website and any related software, features, tools, and
          services (collectively, the "Service"). By registering for or using the Service, you agree to be bound by
          these Terms.
        </p>
        <br />
        <h2>1. Acceptance of Terms</h2>
        <p>
          By using the Service, you agree to these Terms. If you don't agree to any part of these Terms, you may not use
          the Service.
        </p>

        <h2>2. Changes to Terms</h2>
        <p>
          We reserve the right to modify these Terms at any time. We will notify you of changes by updating the Last
          Updated date at the top of this page. Your continued use of the Service after changes become effective will be
          seen as acceptance of those changes.
        </p>

        <h2>3. Privacy</h2>
        <p>
          Your privacy is important to us. Our Privacy Policy explains how we collect, use, and share your personal
          information. By using the Service, you agree to the Privacy Policy.
        </p>

        <h2>4. Account Creation</h2>
        <p>
          To access certain features of the Service, you must create an account. You are responsible for maintaining the
          security of your account and for all activities that occur under your account.
        </p>

        <h2>5. Use of the Service</h2>
        <p>
          You may use the Service only for lawful purposes within the stated context of adsviewer.io's intended and
          acceptable use.
        </p>

        <h2>6. Content and Conduct</h2>
        <p>
          You are responsible for all content you provide and your activities on the Service. You shall not use the
          Service for any illegal purposes or to transmit content that may be considered as defamatory, infringing, or
          otherwise unlawful.
        </p>

        <h2>7. Intellectual Property Rights</h2>
        <p>
          The Service and its original content, features, functionality, and design elements are and will remain the
          exclusive property of adsviewer.io and its licensors.
        </p>

        <h2>8. Third-party Services</h2>
        <p>
          Our Service may contain links to third-party web sites or services that are not owned or controlled by
          adsviewer.io. We have no control over and assume no responsibility for, the content, privacy policies, or
          practices of any third-party web sites or services.
        </p>

        <h2>9. Termination</h2>
        <p>
          We may terminate or suspend access to our Service immediately, without prior notice or liability, for any
          reason whatsoever, including, without limitation, a breach of the Terms.
        </p>

        <h2>10. Disclaimer</h2>
        <p>
          Your use of the Service is at your sole risk. The Service is provided on an "AS IS" and "AS AVAILABLE" basis.
          The Service is provided without warranties of any kind.
        </p>

        <h2>11. Limitation of Liability</h2>
        <p>
          In no event shall adsviewer.io, nor its directors, employees, partners, agents, suppliers, or affiliates, be
          liable for any indirect, incidental, special, consequential, or punitive damages, including without
          limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or
          use of or inability to access or use the Service.
        </p>

        <h2>12. Governing Law</h2>
        <p>
          These Terms shall be governed by and construed in accordance with the laws of [Your Country/State], without
          regard to its conflict of law provisions.
        </p>

        <h2>13. Changes to Service</h2>
        <p>
          We reserve the right to withdraw or amend our Service, and any service or material we provide via the Service,
          in our sole discretion without notice.
        </p>

        <h2>14. Contact Us</h2>
        <p>
          If you have any questions about these Terms, please contact{' '}
          <a href="mailto:info@adsviewer.io">info@adsviewer.io</a>
        </p>
      </section>
    </div>
  );
}

export default SupportPage;
