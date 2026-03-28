export interface ServicePreset {
  name: string;
  amount: number;
  billingCycle: "monthly" | "annual";
  category: string;
}

export const POPULAR_SERVICES: ServicePreset[] = [
  // Streaming Video
  { name: "Netflix", amount: 15.49, billingCycle: "monthly", category: "Streaming" },
  { name: "Hulu", amount: 7.99, billingCycle: "monthly", category: "Streaming" },
  { name: "Disney+", amount: 7.99, billingCycle: "monthly", category: "Streaming" },
  { name: "Max (HBO)", amount: 15.99, billingCycle: "monthly", category: "Streaming" },
  { name: "Amazon Prime Video", amount: 8.99, billingCycle: "monthly", category: "Streaming" },
  { name: "Apple TV+", amount: 9.99, billingCycle: "monthly", category: "Streaming" },
  { name: "Peacock", amount: 5.99, billingCycle: "monthly", category: "Streaming" },
  { name: "Paramount+", amount: 5.99, billingCycle: "monthly", category: "Streaming" },
  { name: "ESPN+", amount: 10.99, billingCycle: "monthly", category: "Streaming" },
  { name: "Crunchyroll", amount: 7.99, billingCycle: "monthly", category: "Streaming" },
  { name: "YouTube Premium", amount: 13.99, billingCycle: "monthly", category: "Streaming" },
  { name: "Fubo TV", amount: 74.99, billingCycle: "monthly", category: "Streaming" },
  { name: "AMC+", amount: 8.99, billingCycle: "monthly", category: "Streaming" },
  { name: "Shudder", amount: 5.99, billingCycle: "monthly", category: "Streaming" },
  { name: "MUBI", amount: 14.99, billingCycle: "monthly", category: "Streaming" },
  // Music
  { name: "Spotify", amount: 10.99, billingCycle: "monthly", category: "Music" },
  { name: "Apple Music", amount: 10.99, billingCycle: "monthly", category: "Music" },
  { name: "Tidal", amount: 10.99, billingCycle: "monthly", category: "Music" },
  { name: "YouTube Music", amount: 10.99, billingCycle: "monthly", category: "Music" },
  { name: "Amazon Music Unlimited", amount: 10.99, billingCycle: "monthly", category: "Music" },
  { name: "Pandora Plus", amount: 4.99, billingCycle: "monthly", category: "Music" },
  { name: "Deezer", amount: 10.99, billingCycle: "monthly", category: "Music" },
  { name: "SiriusXM", amount: 9.99, billingCycle: "monthly", category: "Music" },
  // Gaming
  { name: "Xbox Game Pass Ultimate", amount: 19.99, billingCycle: "monthly", category: "Gaming" },
  { name: "PlayStation Plus", amount: 9.99, billingCycle: "monthly", category: "Gaming" },
  { name: "Nintendo Switch Online", amount: 19.99, billingCycle: "annual", category: "Gaming" },
  { name: "EA Play", amount: 4.99, billingCycle: "monthly", category: "Gaming" },
  { name: "Apple Arcade", amount: 6.99, billingCycle: "monthly", category: "Gaming" },
  { name: "GeForce Now", amount: 9.99, billingCycle: "monthly", category: "Gaming" },
  // Productivity
  { name: "Microsoft 365 Personal", amount: 6.99, billingCycle: "monthly", category: "Productivity" },
  { name: "Adobe Creative Cloud", amount: 54.99, billingCycle: "monthly", category: "Productivity" },
  { name: "Adobe Photoshop", amount: 20.99, billingCycle: "monthly", category: "Productivity" },
  { name: "Notion", amount: 10, billingCycle: "monthly", category: "Productivity" },
  { name: "Figma", amount: 12, billingCycle: "monthly", category: "Productivity" },
  { name: "Slack", amount: 7.25, billingCycle: "monthly", category: "Productivity" },
  { name: "Zoom", amount: 15.99, billingCycle: "monthly", category: "Productivity" },
  { name: "Dropbox Plus", amount: 11.99, billingCycle: "monthly", category: "Productivity" },
  { name: "Evernote", amount: 14.99, billingCycle: "monthly", category: "Productivity" },
  { name: "Grammarly", amount: 12, billingCycle: "monthly", category: "Productivity" },
  // Cloud Storage
  { name: "Google One (2TB)", amount: 9.99, billingCycle: "monthly", category: "Cloud Storage" },
  { name: "iCloud+ (200GB)", amount: 2.99, billingCycle: "monthly", category: "Cloud Storage" },
  { name: "OneDrive", amount: 1.99, billingCycle: "monthly", category: "Cloud Storage" },
  { name: "Backblaze", amount: 9, billingCycle: "monthly", category: "Cloud Storage" },
  // Security / VPN
  { name: "1Password", amount: 2.99, billingCycle: "monthly", category: "Security" },
  { name: "LastPass", amount: 3, billingCycle: "monthly", category: "Security" },
  { name: "NordVPN", amount: 4.99, billingCycle: "monthly", category: "Security" },
  { name: "ExpressVPN", amount: 8.32, billingCycle: "monthly", category: "Security" },
  { name: "Norton 360", amount: 4.99, billingCycle: "monthly", category: "Security" },
  { name: "Dashlane", amount: 4.99, billingCycle: "monthly", category: "Security" },
  // Fitness / Health
  { name: "Peloton App", amount: 12.99, billingCycle: "monthly", category: "Fitness" },
  { name: "Headspace", amount: 12.99, billingCycle: "monthly", category: "Fitness" },
  { name: "Calm", amount: 14.99, billingCycle: "monthly", category: "Fitness" },
  { name: "MyFitnessPal", amount: 19.99, billingCycle: "monthly", category: "Fitness" },
  { name: "Strava", amount: 11.99, billingCycle: "monthly", category: "Fitness" },
  { name: "Noom", amount: 60, billingCycle: "monthly", category: "Fitness" },
  { name: "BODi (Beachbody)", amount: 9.99, billingCycle: "monthly", category: "Fitness" },
  { name: "Nike Training Club", amount: 14.99, billingCycle: "monthly", category: "Fitness" },
  // News / Reading
  { name: "New York Times", amount: 17, billingCycle: "monthly", category: "News & Reading" },
  { name: "Wall Street Journal", amount: 19.99, billingCycle: "monthly", category: "News & Reading" },
  { name: "Washington Post", amount: 9.99, billingCycle: "monthly", category: "News & Reading" },
  { name: "The Athletic", amount: 7.99, billingCycle: "monthly", category: "News & Reading" },
  { name: "Kindle Unlimited", amount: 11.99, billingCycle: "monthly", category: "News & Reading" },
  { name: "Audible", amount: 14.95, billingCycle: "monthly", category: "News & Reading" },
  { name: "Scribd", amount: 11.99, billingCycle: "monthly", category: "News & Reading" },
  { name: "Blinkist", amount: 12.99, billingCycle: "monthly", category: "News & Reading" },
  { name: "The Economist", amount: 22, billingCycle: "monthly", category: "News & Reading" },
  // Food / Delivery
  { name: "DoorDash DashPass", amount: 9.99, billingCycle: "monthly", category: "Food & Delivery" },
  { name: "Grubhub+", amount: 9.99, billingCycle: "monthly", category: "Food & Delivery" },
  { name: "Instacart+", amount: 9.99, billingCycle: "monthly", category: "Food & Delivery" },
  { name: "HelloFresh", amount: 60, billingCycle: "monthly", category: "Food & Delivery" },
  { name: "Factor Meals", amount: 77, billingCycle: "monthly", category: "Food & Delivery" },
  // Developer Tools
  { name: "GitHub Pro", amount: 4, billingCycle: "monthly", category: "Developer Tools" },
  { name: "Vercel Pro", amount: 20, billingCycle: "monthly", category: "Developer Tools" },
  { name: "Netlify", amount: 19, billingCycle: "monthly", category: "Developer Tools" },
  { name: "DigitalOcean", amount: 6, billingCycle: "monthly", category: "Developer Tools" },
  { name: "Cloudflare Pro", amount: 20, billingCycle: "monthly", category: "Developer Tools" },
  { name: "Linear", amount: 8, billingCycle: "monthly", category: "Developer Tools" },
  { name: "Cursor", amount: 20, billingCycle: "monthly", category: "Developer Tools" },
  // Membership / Shopping
  { name: "Amazon Prime", amount: 14.99, billingCycle: "monthly", category: "Membership" },
  { name: "Costco Gold Star", amount: 65, billingCycle: "annual", category: "Membership" },
  { name: "Sam's Club", amount: 50, billingCycle: "annual", category: "Membership" },
  { name: "Walmart+", amount: 12.95, billingCycle: "monthly", category: "Membership" },
  { name: "Target Circle 360", amount: 9.99, billingCycle: "monthly", category: "Membership" },
  // Communication
  { name: "Google Workspace", amount: 6, billingCycle: "monthly", category: "Communication" },
  { name: "Discord Nitro", amount: 9.99, billingCycle: "monthly", category: "Communication" },
  { name: "Twitch Turbo", amount: 8.99, billingCycle: "monthly", category: "Communication" },
  // Design / Creative
  { name: "Canva Pro", amount: 12.99, billingCycle: "monthly", category: "Design" },
  { name: "Midjourney", amount: 10, billingCycle: "monthly", category: "Design" },
  { name: "Shutterstock", amount: 29, billingCycle: "monthly", category: "Design" },
  // Learning
  { name: "LinkedIn Premium", amount: 39.99, billingCycle: "monthly", category: "Learning" },
  { name: "Duolingo Plus", amount: 6.99, billingCycle: "monthly", category: "Learning" },
  { name: "MasterClass", amount: 10, billingCycle: "monthly", category: "Learning" },
  { name: "Skillshare", amount: 32, billingCycle: "monthly", category: "Learning" },
  { name: "Coursera Plus", amount: 59, billingCycle: "monthly", category: "Learning" },
  { name: "Rosetta Stone", amount: 11.99, billingCycle: "monthly", category: "Learning" },
  // AI Tools
  { name: "ChatGPT Plus", amount: 20, billingCycle: "monthly", category: "AI Tools" },
  { name: "Claude Pro", amount: 20, billingCycle: "monthly", category: "AI Tools" },
  // Website Builders
  { name: "Wix", amount: 16, billingCycle: "monthly", category: "Website" },
  { name: "Squarespace", amount: 16, billingCycle: "monthly", category: "Website" },
  // Bundles
  { name: "Apple One", amount: 19.95, billingCycle: "monthly", category: "Bundle" },
];
