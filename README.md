# influencer-booster

The future of influencer marketing - a marketing streaming protocol which enables trustless deals between enterprises and influencers with payment based on performance and impact.

Project Details - https://devfolio.co/projects/influencer-booster-823c

## Folder overview

- `hardhat` folder contains the smart contracts, namely the `StreamingModule` which is the crux behind whitelisting addresses, upgrading tokens to Super tokens, and creating and updating streams to pre-approved addresses.
- `firebase` folder contains CRUD operations for data stored in Firestore (not needed to be put on-chain).
- `hooks` and `pages` folder contain Next.js components.

## Steps to run

First, run the hardhat node using - 

```npx run hardhat-node```

In a second terminal, deploy the contract needed for the platform to function -

```npm run hardhat-deploy```

Lastly, start the development server using - 

```npm run dev```

## Architecture

![influencer-booster](https://github.com/MahikaJaguste/influencer-booster/blob/main/public/faq.png)
