export type OnboardingV2ChoiceStep = {
  id: string;
  type: 'choice';
  title: string;
  desc: string;
  options: string[];
};

export type OnboardingV2PhoneStep = {
  id: string;
  type: 'phone';
  title: string;
  desc: string;
};

export type OnboardingV2LocationStep = {
  id: string;
  type: 'location';
  title: string;
  desc: string;
};

export type OnboardingV2Step = OnboardingV2ChoiceStep | OnboardingV2PhoneStep | OnboardingV2LocationStep;

export const AUTH_ONBOARDING_V2_DATA: OnboardingV2Step[] = [
  {
    id: 'culinary_identity',
    type: 'choice',
    title: 'Culinary Identity',
    desc: 'What defines your palate?',
    options: ['Minimalist', 'Maximalist', 'Experimental', 'Traditional'],
  },
  {
    id: 'dietary_map',
    type: 'choice',
    title: 'Dietary Map',
    desc: 'Any restrictions for the engine?',
    options: ['None', 'Vegetarian', 'Vegan', 'Keto', 'Paleo'],
  },
  {
    id: 'global_tastes',
    type: 'choice',
    title: 'Global Tastes',
    desc: 'Which regions inspire you?',
    options: ['East Asian', 'Mediterranean', 'Nordic', 'Latin American'],
  },
  {
    id: 'phone',
    type: 'phone',
    title: 'Studio Contact',
    desc: 'Enter your mobile number for secure access.',
  },
  {
    id: 'location',
    type: 'location',
    title: 'Culinary Grid',
    desc: 'Where are you scouting from?',
  },
];
