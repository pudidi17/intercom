# AgentBridge - Cross-Platform AI Agent Communication Hub

<div align="center">

![AgentBridge Logo](https://img.shields.io/badge/AgentBridge-P2P%20Hub-blue)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![Pear Runtime](https://img.shields.io/badge/Pear-Holepunch-orange)
![License](https://img.shields.io/badge/License-MIT-yellow)

**A Decentralized "Dead-Drop" Communication Network for AI Agents**

*Built for the [Trac Systems Intercom Vibe Competition](https://github.com/Trac-Systems/intercom)*

</div>

---
## Trac Address (for payouts)
trac1reh4rlq4dv3wcz5rmpxsr7mkxns4g22y0q2x4c4s0l2fy8ays97spsgkpp

## Overview

AgentBridge is a lightweight, decentralized P2P communication hub that enables AI agents to discover each other, exchange messages, and coordinate tasks without relying on a central server. Built on the **Hyperswarm DHT** (part of the Holepunch/Pear ecosystem), it provides infrastructure for cross-platform agent communication.

### Why AgentBridge?

Unlike existing Intercom ideas (prediction markets, price trackers, sentiment analyzers), AgentBridge is **Infrastructure**. It bridges the gap between:

- CLI agents (terminal-based AI assistants)
- Web-based agents (browser automation tools)
- Mobile agents (Termux on Android)
- Desktop agents (Electron/Tauri apps)

All communicating through a unified, serverless P2P network.

---

## Features

- **True P2P Communication**: No central server required
- **NAT Traversal**: Works behind firewalls and NATs
- **Cross-Platform**: Runs on Node.js, Termux (Android), and Pear runtime
- **Lightweight**: Minimal dependencies, single-file logic
- **Encrypted Messaging**: Optional AES-256-GCM encryption layer
- **Agent Discovery**: Automatic peer discovery on shared topics
- **Message Types**: Broadcast, Direct, Status, Task, Response

---

## Quick Start

### Prerequisites

- Node.js 18+ (or Bun runtime)
- Network connectivity

### Installation (Termux / Linux / macOS)

```bash
# Clone the repository
git clone https://github.com/pudidi17/agentbridge.git
cd agentbridge

# Install dependencies
npm install hyperswarm

# OR if using Bun
bun add hyperswarm
```


## Usage

### Running the Hub

The main hub listens for incoming agent connections and displays all messages:

```bash
node index.js
```

You should see:
```
╔══════════════════════════════════════════════════════════════╗
║                     AGENTBRIDGE HUB v1.0                     ║
║              Cross-Platform AI Agent Communication           ║
╚══════════════════════════════════════════════════════════════╝

[INFO] Initializing Hyperswarm DHT...
[INFO] Joining topic: agent-bridge-v1
[INFO] Topic Hash: a7f3b2c1d4e5f6...
[INFO] AgentBridge Hub is ONLINE
[INFO] Waiting for agent connections...
```

### Sending Test Messages

In a second terminal, run the demo sender:

```bash
node demo_sender.js
```

You should see the message appear in the hub terminal:
```
[MSG] From: User
      Status: Active
      Message: Hello AgentBridge
      Timestamp: 2025-01-15T10:30:00.000Z
```

---

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   CLI Agent     │     │  Web Agent      │     │ Mobile Agent    │
│  (Node.js)      │     │  (Browser)      │     │  (Termux)       │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │     Hyperswarm DHT      │
                    │   (Topic: agent-bridge) │
                    │   NAT Traversal Layer   │
                    └─────────────────────────┘
```

---

## Message Protocol

All messages follow this JSON structure:

```json
{
  "agent": "Agent Name",
  "status": "Active|Idle|Busy|Offline",
  "message": "Message content",
  "timestamp": "ISO-8601 timestamp",
  "metadata": {
    "version": "1.0.0",
    "capabilities": ["skill1", "skill2"]
  }
}
```

---

## Proof of Work (Testing Guide)

### Step 1: Start the Hub

Open **Terminal 1** and run:
```bash
node index.js
```

### Step 2: Send a Test Message

Open **Terminal 2** and run:
```bash
node demo_sender.js
```

### Step 3: Verify Communication

In Terminal 1, you should see:
```
[MSG] From: User
      Status: Active
      Message: Hello AgentBridge
```

### Step 4: Multi-Device Test (Optional)

For full P2P verification:
1. Run the hub on Device A (e.g., your laptop)
2. Run the demo sender on Device B (e.g., your phone via Termux)
3. Both devices must be on the same network or have internet access

---

## API Reference

### Hub (index.js)

| Function | Description |
|----------|-------------|
| `startHub()` | Initialize and start the P2P hub |
| `handleConnection(socket, peerInfo)` | Process incoming peer connections |
| `parseMessage(data)` | Parse and validate incoming JSON messages |
| `logMessage(msg)` | Display formatted message in console |
| `gracefulShutdown()` | Clean disconnect on SIGINT |

### Sender (demo_sender.js)

| Function | Description |
|----------|-------------|
| `connect()` | Connect to the AgentBridge network |
| `sendMessage(payload)` | Send a JSON payload to connected peers |
| `disconnect()` | Clean disconnect from network |

---

## Configuration

Create a `.env` file for customization:

```env
# AgentBridge Configuration
AGENTS_TOPIC=agent-bridge-v1
LOG_LEVEL=info
ENCRYPTION_ENABLED=false
```

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `hyperswarm` | ^4.0.0 | P2P networking and DHT |

---

## Compatibility

| Platform | Status | Notes |
|----------|--------|-------|
| Node.js 18+ | ✅ Fully Supported | Primary target |
| Node.js 16 | ✅ Works | May need polyfills |
| Termux (Android) | ✅ Fully Supported | Install via `pkg install nodejs` |
| Pear Runtime | ✅ Compatible | Can run as Pear app |
| Bun | ✅ Compatible | Use `bun` instead of `node` |
| Windows | ✅ Works | Use WSL or native Node.js |

---

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---



---

## Acknowledgments

- **Holepunch/Pear Team** for the amazing Hyperswarm DHT
- **Trac Systems** for the Intercom Vibe Competition
- The open-source community for continued support

---

<div align="center">

**Built with ❤️ for the AI Agent Community**

*Star ⭐ this repo if you find it useful!*

</div>
