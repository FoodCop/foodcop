import { ScrollArea } from '../../ui/scroll-area';
import { Separator } from '../../ui/separator';

export function PrivacyPolicy() {
  return (
    <ScrollArea className="h-[calc(100vh-120px)] py-6">
      <div className="space-y-6 pr-4">
        <div>
          <h3 className="mb-3">Privacy Policy</h3>
          <p className="text-neutral-600">
            Last updated: October 23, 2025
          </p>
        </div>

        <Separator />

        <div>
          <h4 className="mb-2">1. Information We Collect</h4>
          <p className="text-neutral-600 mb-3">
            We collect information you provide directly to us, including your name, 
            email address, username, profile photo, and any other information you 
            choose to provide when using the Plate food discovery app.
          </p>
          <p className="text-neutral-600">
            We also collect information about your usage of the app, including posts, 
            photos, recipes, videos, and interactions with other users and restaurants.
          </p>
        </div>

        <Separator />

        <div>
          <h4 className="mb-2">2. How We Use Your Information</h4>
          <p className="text-neutral-600 mb-3">
            We use the information we collect to:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-neutral-600">
            <li>Provide, maintain, and improve our services</li>
            <li>Personalize your experience and content recommendations</li>
            <li>Send you technical notices and support messages</li>
            <li>Communicate with you about products, services, and events</li>
            <li>Monitor and analyze trends and usage</li>
            <li>Detect, prevent, and address technical issues</li>
          </ul>
        </div>

        <Separator />

        <div>
          <h4 className="mb-2">3. Information Sharing</h4>
          <p className="text-neutral-600 mb-3">
            We do not sell your personal information to third parties. We may share 
            your information in the following circumstances:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-neutral-600">
            <li>With your consent or at your direction</li>
            <li>With service providers who perform services on our behalf</li>
            <li>To comply with legal obligations</li>
            <li>To protect our rights and prevent fraud</li>
            <li>In connection with a business transaction or merger</li>
          </ul>
        </div>

        <Separator />

        <div>
          <h4 className="mb-2">4. Data Security</h4>
          <p className="text-neutral-600">
            We take reasonable measures to protect your information from unauthorized 
            access, use, or disclosure. However, no internet or electronic storage 
            system is completely secure, so we cannot guarantee absolute security.
          </p>
        </div>

        <Separator />

        <div>
          <h4 className="mb-2">5. Your Rights</h4>
          <p className="text-neutral-600 mb-3">
            You have the right to:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-neutral-600">
            <li>Access and update your personal information</li>
            <li>Request deletion of your account and data</li>
            <li>Opt out of marketing communications</li>
            <li>Export your data</li>
            <li>Withdraw consent for data processing</li>
          </ul>
        </div>

        <Separator />

        <div>
          <h4 className="mb-2">6. Cookies and Tracking</h4>
          <p className="text-neutral-600">
            We use cookies and similar tracking technologies to track activity on 
            our service and hold certain information. You can instruct your browser 
            to refuse all cookies or to indicate when a cookie is being sent.
          </p>
        </div>

        <Separator />

        <div>
          <h4 className="mb-2">7. Children's Privacy</h4>
          <p className="text-neutral-600">
            Our service is not intended for children under 13 years of age. We do 
            not knowingly collect personal information from children under 13.
          </p>
        </div>

        <Separator />

        <div>
          <h4 className="mb-2">8. Changes to This Policy</h4>
          <p className="text-neutral-600">
            We may update our Privacy Policy from time to time. We will notify you 
            of any changes by posting the new Privacy Policy on this page and 
            updating the "Last updated" date.
          </p>
        </div>

        <Separator />

        <div>
          <h4 className="mb-2">9. Contact Us</h4>
          <p className="text-neutral-600">
            If you have any questions about this Privacy Policy, please contact us at:
          </p>
          <p className="text-neutral-600 mt-2">
            Email: privacy@plate.app<br />
            Address: 123 Food Street, San Francisco, CA 94102
          </p>
        </div>
      </div>
    </ScrollArea>
  );
}
