  1. How do you plan to handle GE-Tracker authentication for scraping?
  - A. Use a single personal account/token (as shown in your example)
  - B. Build user authentication where users provide their own GE-Tracker credentials
  - C. Focus only on publicly available data (no auth required)
  - D. Other: [please specify]

  2. For the "profitable trades" calculation, what's the core trading strategy?
  - A. Simple flip: Buy at "Buying Low" and sell at "Selling High" (margin trading)
  - B. Buy at "Overall Low" and sell at "Overall High"
  - C. Support multiple strategies that users can choose from
  - D. Other: [please specify]

  3. How should the initial item list be populated?
  - A. Start with a curated list of popular/high-volume items (100-500 items)
  - B. Scrape ALL available items from GE-Tracker (thousands of items)
  - C. Let users manually add items they want to track
  - D. Other: [please specify]

  4. What's the expected usage pattern for this tool?
  - A. Single user/personal tool (no user accounts needed)
  - B. Multi-user with accounts but data is shared across all users
  - C. Multi-user with individual tracking/preferences per user
  - D. Other: [please specify]

  5. For the "suggested items to purchase" feature, should it factor in:
  - A. Just PnL (profit margin × buy limit)
  - B. PnL + trading volume (to ensure liquidity)
  - C. PnL + volume + historical success rate
  - D. Other: [please specify]

❯ 1. The request i provided can be done publicly without anything, just make sure not to KO their service, if they will start banning us we will think about proxy rotation. 2. A. 3.B, 4. B. 5. B 


  1. For the dashboard layout - Do you have a specific design in mind, or should I assume a standard layout (header, sidebar filters, main content area)?
  2. For authentication - Should I use the existing AdonisJS auth setup (I see it's already configured with sessions), or do you want something different on the frontend (e.g., JWT tokens)?
  3. For the items table - Do you prefer a data table component (like Tanstack Table) for sorting/filtering client-side, or keep it simple with server-side only?
  4. For filters - Should filters apply instantly on change, or require an "Apply" button click?

  Let me know your preferences and I'll update the PRD with more granular stories (~35-40 stories instead of 20).

  1. Just use standard shadcn layout. 2. Just use default adonis one 3. Lets server side only and FE just renders 4. Filters apply instantly on change


  ---

    1. How do we get the full item list from GE-Tracker?
  You only showed the price endpoint (/api/graph/{itemId}/day). How do we discover all item IDs?
  - A. There's a /api/items or similar endpoint that lists all items
  - B. Scrape the HTML sitemap/category pages
  - C. Use a different source (OSRS Wiki, RuneLite) for the item list, only use GE-Tracker for prices
  - D. You have/can provide a static list of item IDs

  2. How do we calculate high/low from the price data?
  The API response shows individual data points with buyingPrice, sellingPrice, overallPrice. To get highs/lows, should we:
  - A. Take max/min of each field across the day's data array
  - B. Use a different endpoint that provides highs/lows directly
  - C. Other approach

  3. For authentication, how minimal can we go?
  - A. Just email + password (no verification, no password reset)
  - B. Email + password with email verification
  - C. Add password reset flow too

  4. For the responsive layout, do we actually need a hamburger menu?
  - A. Yes, full hamburger menu for mobile
  - B. No, just stack the nav items vertically on mobile
  - C. Keep it desktop-only for MVP, mobile can scroll



1. I have provided another list from https://oldschool.runescape.wiki/w/Item_IDs, this is a research part on your side, maybe there is a npm package or something else that you can get all of the items id.
2. A
3. Just make it no auth right now, use session id and cookie to track user
4. A