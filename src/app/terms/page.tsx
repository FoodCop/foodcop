import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/LegalPage';
import { TERMS_VERSION } from '@/lib/onboarding/policy';

export const metadata: Metadata = { title: 'Terms of Service · FUZO' };

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      version={TERMS_VERSION}
      intro="These terms explain the rules for using FUZO: discovering food, sharing posts and running a food business profile."
      sections={[
        {
          title: 'Who can use FUZO',
          body: [
            'You must be at least 13 years old to use FUZO (14 if you live in Quebec).',
            'People who set up a food business account must be 18 or older and allowed to act for that business.',
          ],
        },
        {
          title: 'Your account',
          body: [
            'Keep your sign-in details safe. You are responsible for what happens on your account.',
            'Your account type (Individual or Food Business) is chosen when you join and can’t be switched later.',
          ],
        },
        {
          title: 'What you post',
          body: [
            'You keep ownership of the photos, videos, reviews and recipes you post, and you let FUZO show them in the app.',
            'Only post things you have the right to share. Imported posts are credited to their creator.',
            'Posts are moderated. Content that is illegal, hateful, misleading or unsafe can be removed.',
          ],
        },
        {
          title: 'Food businesses',
          body: [
            'A business profile is public as soon as it is created.',
            'Business tools (posting as the business, the business dashboard, advertising, FUZO Loyalty and the Verified badge) open once FUZO approves the business’s documents. Documents are due within 15 days of creating the account.',
            'Customers can tag a business’s location in their own posts whether or not it is verified.',
          ],
        },
        {
          title: 'Delivery and other services',
          body: [
            'FUZO doesn’t deliver food or take delivery orders. Delivery buttons open the business’s listing on a third-party app, under that app’s own terms.',
          ],
        },
        {
          title: 'Ending your account',
          body: ['You can stop using FUZO at any time. FUZO can suspend accounts that break these terms.'],
        },
      ]}
    />
  );
}
