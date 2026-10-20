import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/LegalPage';
import { PRIVACY_VERSION } from '@/lib/onboarding/policy';

export const metadata: Metadata = { title: 'Privacy Policy · FUZO' };

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      version={PRIVACY_VERSION}
      intro="This policy explains what FUZO collects, why, and the choices you have."
      sections={[
        {
          title: 'What we collect',
          body: [
            'Account details: your name, email, username and, if you add them, a photo and bio.',
            'Your birth month and year, used only to check you are old enough and to apply the right protections. They are private and never shown on your profile.',
            'What you post and save, and your food preferences if you choose to share them.',
            'Your location when you allow it, to show places near you.',
            'For food businesses: business details, locations, and the documents you upload for verification.',
          ],
        },
        {
          title: 'How we use it',
          body: [
            'To run FUZO, personalise recommendations, keep the community safe and verify food businesses.',
            'Food preferences only personalise what you see. Skipping them never limits what you can do.',
          ],
        },
        {
          title: 'Who can see it',
          body: [
            'Your public profile and posts follow your privacy setting (Public, Followers or Private).',
            'Members under 18 start with a private profile and no exact location on their posts.',
            'Business documents are only seen by the business owner and FUZO’s reviewers.',
            'Messages are end-to-end encrypted.',
          ],
        },
        {
          title: 'Your choices',
          body: [
            'You can see, correct or delete your information, change your privacy setting, and turn off location at any time.',
            'Ask FUZO support to correct your birth date or to delete your account.',
          ],
        },
        {
          title: 'Keeping it safe',
          body: ['Data is stored with access controls, and every decision on business verification is logged.'],
        },
      ]}
    />
  );
}
