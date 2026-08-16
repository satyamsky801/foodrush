import { heroImage } from '../utils/images';

// Promotional banners shown in the home page carousel.
export const offerBanners = [
  {
    id: 'offer-1',
    title: '50% OFF',
    subtitle: 'up to ₹100 on your first order',
    code: 'WELCOME50',
    gradient: 'from-brand-500 to-ember-500',
    image: heroImage(0),
  },
  {
    id: 'offer-2',
    title: 'Free Delivery',
    subtitle: 'on all orders above ₹499',
    code: 'FREEDEL',
    gradient: 'from-rose-500 to-ember-600',
    image: heroImage(1),
  },
  {
    id: 'offer-3',
    title: '20% OFF',
    subtitle: 'up to ₹150 on orders above ₹299',
    code: 'FOOD20',
    gradient: 'from-amber-500 to-brand-500',
    image: heroImage(2),
  },
];
