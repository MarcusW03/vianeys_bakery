import type { SiteConfig } from './types';

export const defaultConfig: SiteConfig = {
  siteName: "Vianey's Bakery",
  hero: {
    headline: "Handcrafted with Love",
    subtext: "Custom cakes and pastries for every occasion. Made to order, made for you.",
    ctaText: "How to order",
    imageUrl: "",
  },
  featuredImageUrls: [],
  gallery: {
    categories: [
      {
        id: "wedding",
        name: "Wedding Cakes",
        images: [],
      },
      {
        id: "birthday",
        name: "Birthday Cakes",
        images: [],
      },
      {
        id: "cupcakes",
        name: "Cupcakes",
        images: [],
      },
      {
        id: "pastries",
        name: "Pastries",
        images: [],
      },
      {
        id: "cat-1782607678539",
        name: "New Category",
        images: [],
      },
    ],
  },
  pricing: {
    headline: "Pricing",
    items: [
      {
        id: "custom-cake",
        name: "Small personalized Cake",
        description: "Fully customized design, flavors, and fillings. Feds 10–50 guests.",
        priceRange: "Starting at $85",
      },
      {
        id: "wedding-cake",
        name: "Wedding Cake",
        description: "Multi-tier celebration cakes with premium ingredients and detailed decoration.",
        priceRange: "Starting at $250",
      },
      {
        id: "cupcakes",
        name: "Cupcakes (dozen)",
        description: "Custom flavored cupcakes with buttercream or fondant decorations.",
        priceRange: "Starting at $36",
      },
      {
        id: "pastry-box",
        name: "Pastry Box",
        description: "Assorted pastries — great for events, gifts, and celebrations.",
        priceRange: "Starting at $45",
      },
      {
        id: "item-1782607430387",
        name: "Cakepops",
        description: "something",
        priceRange: "Price TBD",
      },
    ],
  },
  howToOrder: {
    headline: "How to Order",
    steps: [
      {
        id: "step-1",
        stepNumber: 1,
        title: "Reach Out",
        description: "Contact us via Instagram, Facebook, or email to discuss your event and vision.",
      },
      {
        id: "step-2",
        stepNumber: 2,
        title: "Design Consultation",
        description: "We'll talk through flavors, design ideas, and sizing to create your perfect order.",
      },
      {
        id: "step-3",
        stepNumber: 3,
        title: "Confirm & Deposit",
        description: "A 50% deposit secures your date. Orders are confirmed once deposit is received.",
      },
      {
        id: "step-4",
        stepNumber: 4,
        title: "Pick Up or Delivery",
        description: "Your order will be ready on the agreed date. Local delivery available.",
      },
    ],
  },
  about: {
    headline: "Made with Passion",
    body: "Hi, I'm Vianey! I've been baking custom cakes and pastries since 2015. Every order is made from scratch using quality ingredients — no shortcuts, no mixes. I love turning your ideas into edible art.",
    imageUrl: "",
  },
  contact: {
    links: [
      { id: "messenger", label: "Messenger", url: "" },
    ],
    location: "",
  },
  sectionTitles: {
    featured: "My Work",
    gallery: "Gallery",
    contact: "Contact",
  },
  theme: {
    primaryColor: "#adadad",
    secondaryColor: "#fff0fb",
    accentColor: "#997178",
  },
  sectionStyles: {
    hero: { background: 'color3', heading: '#ffffff', text: '#1c1c1c' },
    featured: { background: 'color2', heading: 'color3', text: 'color3' },
    gallery: { background: '#f7f7f7', heading: 'color3', text: 'color3' },
    pricing: { background: 'color2', heading: '#ff9999', text: 'color3' },
    'how-to-order': { background: '#e6e6e6', heading: 'color3', text: 'color3' },
    about: { background: '#ffffff', heading: 'color3', text: 'color3' },
    contact: { background: 'color2', heading: 'color3', text: 'color3' },
  },
  sectionOrder: ['hero', 'featured', 'gallery', 'pricing', 'how-to-order', 'about', 'contact'],
  hiddenSections: [],
  lastUpdated: new Date().toISOString(),
};
