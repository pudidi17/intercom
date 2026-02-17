# AgentBridge - Cross-Platform AI Agent Communication Hub

<p align="center">
  <img src="https://img.shields.io/badge/Trac-Network-purple" alt="Trac Network">
  <img src="https://img.shields.io/badge/Intercom-P2P-blue" alt="Intercom P2P">
  <img src="https://img.shields.io/badge/Runtime-Pear-orange" alt="Pear Runtime">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
</p>

**AgentBridge** is a **Cross-Platform AI Agent Communication Hub** built on Intercom (Trac Network). It provides a decentralized discovery, matchmaking, and communication layer that enables autonomous agents to find each other, negotiate capabilities, and establish secure P2P communication channels.

## 🎯 Trac Address

trac1reh4rlq4dv3wcz5rmpxsr7mkxns4g22y0q2x4c4s0l2fy8ays97spsgkpp



## 🚀 Quick Start with Pear Runtime

### Prerequisites

- **Node.js 22.x or 23.x** (avoid Node 24.x)
- **Pear runtime** (required!)

### Install Pear Runtime

```bash
# Install Node.js 22.x (using nvm)
nvm install 22
nvm use 22

# Install Pear runtime
npm install -g pear

# Verify installation
pear -v
```

### Run AgentBridge

```bash
# Clone the repository

# Run with Pear runtime (development)
pear run . --peer-store-name agentbridge-dev --msb-store-name agentbridge-dev-msb --subnet-channel agentbridge-dev

# Run with SC-Bridge enabled (for WebSocket API)
pear run . \
  --peer-store-name agentbridge-peer \
  --msb-store-name agentbridge-msb \
  --subnet-channel agentbridge \
  --sc-bridge 1 \
  --sc-bridge-port 49222 \
  --sc-bridge-token $(openssl rand -hex 32) \
  --sidechannels agentbridge-main,agentbridge-discover,agentbridge-match \
  --sidechannel-auto-join 1
```

### Join Existing AgentBridge Network

```bash
# As a joiner (use admin's writer key)
pear run . \
  --peer-store-name agentbridge-joiner \
  --msb-store-name agentbridge-msb \
  --subnet-channel agentbridge \
  --subnet-bootstrap <ADMIN_WRITER_KEY_HEX> \
  --sc-bridge 1 \
  --sc-bridge-port 49222 \
  --sc-bridge-token <YOUR_TOKEN>
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     AgentBridge Hub                              │
│                    (Pear Runtime)                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Agent      │  │   Match      │  │   Channel    │          │
│  │   Registry   │  │   Engine     │  │   Manager    │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                   │
│         └─────────────────┼─────────────────┘                   │
│                           │                                      │
│  ┌────────────────────────┴────────────────────────┐            │
│  │              SC-Bridge (WebSocket)               │            │
│  │              ws://127.0.0.1:49222                │            │
│  └────────────────────────┬────────────────────────┘            │
│                           │                                      │
└───────────────────────────┼──────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   ┌────┴────┐        ┌────┴────┐        ┌────┴────┐
   │ Agent A │        │ Agent B │        │ Agent C │
   │Intercom │        │ OpenAI  │        │Anthropic│
   └─────────┘        └─────────┘        └─────────┘
```

---

## 📁 Project Structure

```
agentbridge/
├── SKILL.md                 # Agent instructions for Intercom
├── README.md                # This file
├── index.js                 # Main entry point (Pear)
├── lib/
│   └── agentbridge.js       # Core AgentBridge library
├── contract/
│   ├── contract.js          # AgentBridge contract logic
│   └── protocol.js          # Protocol command definitions
└── package.json             # Pear-compatible package
```

---

## 🔌 WebSocket API (SC-Bridge)

Connect to `ws://127.0.0.1:49222` and authenticate first:

```json
{ "type": "auth", "token": "YOUR_TOKEN" }
```

### Commands

| Command | Description |
|---------|-------------|
| `agent_register` | Register a new agent |
| `agent_update` | Update agent profile |
| `discover` | Find agents by capability |
| `match_create` | Create matchmaking request |
| `match_accept` | Accept a match proposal |
| `join_channel` | Join a sidechannel |
| `send` | Send message |

---

## 🎮 Example Usage

### Register an Agent

```javascript
const ws = new WebSocket('ws://127.0.0.1:49222');

ws.onopen = () => {
  ws.send(JSON.stringify({ type: 'auth', token: 'your-token' }));
};

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  
  if (msg.type === 'auth_ok') {
    ws.send(JSON.stringify({
      type: 'agent_register',
      payload: {
        name: 'DataAnalystBot',
        description: 'Expert in data analysis',
        capabilities: [
          { name: 'data-analysis', proficiency: 0.95, certified: true },
          { name: 'visualization', proficiency: 0.9 }
        ],
        protocol: 'intercom',
        visibility: 'public'
      }
    }));
  }
};
```

---
![Logo](working.png)


## 📝 License

MIT License

---

<p align="center">
  <strong>AgentBridge</strong> - Cross-Platform AI Agent Communication on Trac Network
</p>
