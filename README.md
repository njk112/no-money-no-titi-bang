# no-money-no-titi-bang

# Initial Project Description

No money no titi bang, is a OSRS trading focused project which aims to find profitable trades.
What we want to achieve is scrape every available item in https://www.ge-tracker.com/ i.e. https://www.ge-tracker.com/item/divine-magic-potion-4
example request for Divine Ranging potion 4 

```
fetch("https://www.ge-tracker.com/api/graph/23745/day", {
  "headers": {
    "accept": "application/x.getracker.v2+json",
    "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
    "authorization": "Bearer bd73e436b5a87deda66eb9cdd53b13565b758732bae7719546bc5eca630251f2",
    "priority": "u=1, i",
    "sec-ch-ua": "\"Google Chrome\";v=\"143\", \"Chromium\";v=\"143\", \"Not A(Brand\";v=\"24\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"macOS\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "x-api-client": "ge-tracker-api client desktop v5.1.0",
    "x-requested-with": "XMLHttpRequest",
    "x-xsrf-token": "eyJpdiI6IkZsUDdJb3hlbGZSRUVIOWkzZER0ZlE9PSIsInZhbHVlIjoickxxb0dXSzdMTTdacnBnM0RlSEdzd0EwVzB5Vks3alNJR2U1L3gvSTZyakI5cmI0aXhzcXFGTml4UFgzSWhXVlZ6ZDlpUkF2OE9SWlZQTDZnVzQ1MFFtZExKb09nY0ZCcGd6eFpZdjNpY2pFd09JL0hoQy9JeTNMTjVGUVFaUHAiLCJtYWMiOiJiY2YzODMyM2JmNDhhMDUyMDZmMGE5NTBjYTFkYTJiOGRjN2I5NmU2YWQwNjljNTI3NjY4ZTMzNDk0ZmQyMTgzIiwidGFnIjoiIn0="
  },
  "referrer": "https://www.ge-tracker.com/item/divine-magic-potion-4",
  "body": null,
  "method": "GET",
  "mode": "cors",
  "credentials": "include"
});
```
Which then returns an array like

```
"source": "runelite",
    "data": [
        {
            "ts": 1768055400000,
            "overallPrice": 2591,
            "overallCompleted": 140,
            "buyingPrice": 2591,
            "buyingCompleted": 140,
            "sellingCompleted": 0
        },
        {
            "ts": 1768056000000,
            "overallPrice": 2592,
            "overallCompleted": 110,
            "buyingPrice": 2592,
            "buyingCompleted": 110,
            "sellingCompleted": 0
        },
        {
            "ts": 1768056300000,
            "overallPrice": 2515,
            "overallCompleted": 16,
            "buyingPrice": 2592,
            "buyingCompleted": 10,
            "sellingPrice": 2386,
            "sellingCompleted": 6
        },
```

from here we want to find these fields:
Overall High, i.e. 2,641
Buying High, i.e. 2,590
Selling High, i.e. 2,680
Overall Low, i.e. 2,150
Buying Low, i.e. 2,150
Selling Low, i.e. 2,170

Then we want to be able to filter between the highest buying low and selling high.

We also want to have information about overall bought and sold.

We want to store this data in SQLite database and have an api which would allow our frontend to get this data. To populate item details we will need to map our ids to items and their respective icons. 
An example can be seen here https://oldschool.runescape.wiki/w/Item_IDs where 23745 maps to Divine magic potion#(4). You may need to find additional apis or sources to get item tags.

Besides this we will need to find a source of information to find Grand Exchange (GE) buying limits cap. Certain items have different limits.

We want to have our internal database to store these items. Our highs and lows should be synced every 24 hours. Information for selling and buying information also should be stored in a database. 

For frontend we want to have a dashboard page with a list of all of our items, paginated, with top 50 results at the top. Also a search menu to be able to find specific items and filtering information such as price greater than X, distance between X and Y and total bought and sold.

When we click on any of the items, it should open a modal showcasing the item picture and the stats we extracted. Besides that based on the max buying limit we should calculate maximum potential profit. Bear in mind all of our business
logic should live in the backend and frontend should only display data. In the modal we also want a button which opens a link of our selected item in the https://www.ge-tracker.com so a person using it can manually check the item.

As an additional feature, we want to have a page of suggested items to purchase based on PnL - this should work in a way that a user enters the desired amount of money they want to spend and we preselect top 6 items to buy.

For repo structure we have a backend folder Adonis JS and Frontend using Next JS. For database use SQLLite and for UI components use Shadcn, they should be preinstalled. If you want to add additional packages as long as you have a good reason feel free to do so.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or pnpm

### Running the Application

#### Backend (AdonisJS)

```bash
cd backend
npm install
npm run dev
```

The backend will start on `http://localhost:3333`

#### Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

The frontend will start on `http://localhost:3000`

### Available Scripts

**Backend:**
- `npm run dev` - Start development server with HMR
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run test` - Run tests
- `npm run lint` - Run ESLint
- `npm run typecheck` - TypeScript type checking

**Frontend:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint