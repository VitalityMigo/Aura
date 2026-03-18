# Aura — DeFi Trading & Execution Bot

Aura is a DeFi-native trading bot designed to identify, execute, and monitor systematic opportunities across on-chain markets.

The system is Discord-integrated and focuses on **execution efficiency and automation**, and **real-time monitoring of market flows**. The bot covers various on-chain assets and layer such as Ethereum, Base, Solana, and more.

➔ Full documentation is available [here](https://aura-3.gitbook.io/aura/coins/trading-panel/buying).

*Warning: the bot does not provide signal, user are responsible to input their own strategy. Note that this project is not maintained nor publicly hosted anymore*

---

## Features and Specifications

Aura operates as a **systematic trading and execution layer** on top of DeFi infrastructure such as automated market maker (AMM) and DeFi protocols.

### 1. Core Functionalities

- **Custom Monitoring System:** monitors on-chain activity with custom filters (tokens, wallets, protocols), receive low-latency data directly extracted from raw on-chain smart contract instructions.

- **Execution Engine:** low-latency and MEV-protected execution, optimized routing logic through slippage-aware custom Smart Order Router (SOR), custom  parameters for timing, protection and gas optimization.

- **Portfolio & Book Management:** tracks open positions and PnL on hundreeds of assets, open or adjuste positions easily, manage and organize funds accross hundreeds of wallets and layer (multi-wallet bridge)

- **Automated Execution Strategies:** custom event flow tracking and signal, automated execution strategy with highly custom preset (sniping, front-running), notification system.

### 2. Use Cases

- Exploiting short-term price dislocations in the click of a button while getting best execution via SOR.
- Flow-based trading with highly customizable and flexible presets to reduce gas, slippage or price impact risk.
- Deploy systematic reaction to unobservable on-chain events in the contexte such as automatic sell in case of developer sell-off.
- Monitor the deployment of a specific contract's liquidity pool and analyze initial health and honeypot probability.
- Manage funds and on-chain assets accross thousands of wallet and dozens of blockchain layers .


## Project Structure

Aura is built-in Discord and design as an **event-driven system**, in order to enhance flexibility and ease of use.


- **Events Layer (`/events`):** centralizes listening of blockchain activity, signal detection and distribution (new users, trades, liquidity changes).

- **Triggers & Reactions (`/triggers`):** defines the underlying logic to react to specific pre-determined events such as signal for automated strategy.

- **Execution & Functions (`/functions`):** core trading logic, including order construction, smart order routing, execution encoding, risk limits, and more.

- **Commands & Interactions (`/commands`, `/interactions`):** built-in Discord user interface layer. Defines manual control, visualization, overrides etc.

- **Config (`/config`):** specific component enabling users to set their parameters such as execution preset, risk management, as well as wallet environment.

- **Visual & Monitoring (`/visual`):** incorporates data visualization tool and internal monitoring tool, including temporal image storage.



## Contact

Feel free to reach out for any discussion around this project or around traditional or on-chain trading systems.
