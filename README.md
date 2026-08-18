# Bowoweb — Bitcoin Market Desk

One screen for the forces moving Bitcoin now — price, positioning, liquidity, and network health.

Built with [Next.js](https://nextjs.org) (App Router), React 19, TypeScript, and [lightweight-charts](https://github.com/tradingview/lightweight-charts).

## Features

- Live price chart with candlesticks (TradingView lightweight-charts)
- Market stats bar — global market cap, BTC dominance, volume, liquidations
- Fear & Greed sentiment index
- Altseason indicator — altcoin dominance and season detection
- Macro panel — Fed funds rate, CPI, and treasury yields (FRED)
- On-chain panel — mempool fees, network stats, latest block (Mempool.space)
- Technical indicators — RSI, MACD, moving averages, volume profile
- Foils panel — scenario-based price outlooks
- Server-side API routes with in-memory response caching

## Getting started

Requirements: Node.js 18.18+ (or 20+ recommended).

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

Copy `.env.local.example` to `.env.local` (or create it) and optionally set:

| Variable       | Required | Description                              |
| -------------- | -------- | ---------------------------------------- |
| `FRED_API_KEY` | No       | FRED API key for macro data (Fed, CPI). Without it, macro values return as unavailable. |

## Scripts

| Command        | Description                    |
| -------------- | ------------------------------ |
| `npm run dev`  | Start the development server   |
| `npm run build`| Create a production build      |
| `npm run start`| Serve the production build     |
| `npm run lint` | Lint with Oxlint               |

## API routes

| Route                          | Source             | Description                         |
| ------------------------------ | ------------------ | ----------------------------------- |
| `/api/technical/ticker`        | CoinGecko          | Current BTC ticker                  |
| `/api/technical/candles`       | CoinGecko          | OHLCV candles for the chart         |
| `/api/technical/indicators`    | Calculated         | RSI, MACD, MAs, volume profile      |
| `/api/technical/coin-info`     | CoinGecko          | Coin metadata and stats             |
| `/api/onchain/stats`           | Mempool.space      | Bitcoin network statistics          |
| `/api/onchain/fees`            | Mempool.space      | Current mempool fee estimates       |
| `/api/onchain/latest-block`    | Mempool.space      | Latest block info                   |
| `/api/sentiment/fear-greed`    | Alternative.me     | Fear & Greed index                  |
| `/api/macro/current`           | FRED               | Fed funds rate, CPI, treasury rates |
| `/api/market/altseason`        | CoinGecko          | Altcoin season indicator            |
| `/api/market/sectors`          | CoinGecko          | Market sector performance           |
| `/api/market/treasury`         | —                 | Treasury flow data                  |
| `/api/foils/current`           | —                 | Scenario price foils                |
| `/api/health`                  | —                 | Health check                        |

## Project structure

```
src/
├── app/
│   ├── api/            # Server-side data routes
│   └── page.tsx        # Dashboard page
├── components/         # UI panels (PriceChart, MacroPanel, ...)
└── lib/                # Data sources and helpers (coingecko, mempool, ...)
```
