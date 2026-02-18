#!/usr/bin/env node

/**
 * AgentBridge Demo Sender - Verification Script
 * 
 * This script connects to the AgentBridge network and sends test messages
 * to verify that the hub is receiving and processing messages correctly.
 * 
 * Usage: node demo_sender.js [options]
 * 
 * Options:
 *   --agent <name>    Set agent name (default: "User")
 *   --status <status> Set status (default: "Active")
 *   --message <msg>   Set message content (default: "Hello AgentBridge")
 *   --count <n>       Send n messages (default: 1)
 *   --interval <ms>   Interval between messages in ms (default: 1000)
 *   --interactive     Enter interactive mode
 * 
 * @author AgentBridge Team
 * @version 1.0.0
 */

import Hyperswarm from 'hyperswarm'
import crypto from 'crypto'
import readline from 'readline'

// Configuration
const CONFIG = {
  TOPIC_NAME: 'agent-bridge-v1',
  TIMEOUT: 10000, // 10 seconds to find peers
  DEFAULT_AGENT: 'User',
  DEFAULT_STATUS: 'Active',
  DEFAULT_MESSAGE: 'Hello AgentBridge'
}

// ANSI color codes
const COLORS = {
  RESET: '\x1b[0m',
  BRIGHT: '\x1b[1m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  MAGENTA: '\x1b[35m',
  CYAN: '\x1b[36m',
  RED: '\x1b[31m',
  BG_MAGENTA: '\x1b[45m'
}

// Logger
const logger = {
  info: (msg) => console.log(`${COLORS.CYAN}[INFO]${COLORS.RESET} ${msg}`),
  success: (msg) => console.log(`${COLORS.GREEN}[OK]${COLORS.RESET} ${msg}`),
  warn: (msg) => console.log(`${COLORS.YELLOW}[WARN]${COLORS.RESET} ${msg}`),
  error: (msg) => console.log(`${COLORS.RED}[ERROR]${COLORS.RESET} ${msg}`),
  sent: (msg) => console.log(`${COLORS.MAGENTA}[SENT]${COLORS.RESET} ${msg}`)
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2)
  const options = {
    agent: CONFIG.DEFAULT_AGENT,
    status: CONFIG.DEFAULT_STATUS,
    message: CONFIG.DEFAULT_MESSAGE,
    count: 1,
    interval: 1000,
    interactive: false
  }
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--agent':
      case '-a':
        options.agent = args[++i]
        break
      case '--status':
      case '-s':
        options.status = args[++i]
        break
      case '--message':
      case '-m':
        options.message = args[++i]
        break
      case '--count':
      case '-c':
        options.count = parseInt(args[++i], 10) || 1
        break
      case '--interval':
      case '-i':
        options.interval = parseInt(args[++i], 10) || 1000
        break
      case '--interactive':
        options.interactive = true
        break
      case '--help':
      case '-h':
        console.log(`
AgentBridge Demo Sender - Send test messages to AgentBridge Hub

Usage: node demo_sender.js [options]

Options:
  -a, --agent <name>    Set agent name (default: "${CONFIG.DEFAULT_AGENT}")
  -s, --status <status> Set status (default: "${CONFIG.DEFAULT_STATUS}")
  -m, --message <msg>   Set message content (default: "${CONFIG.DEFAULT_MESSAGE}")
  -c, --count <n>       Send n messages (default: 1)
  -i, --interval <ms>   Interval between messages in ms (default: 1000)
  --interactive         Enter interactive mode
  -h, --help            Show this help message

Examples:
  node demo_sender.js
  node demo_sender.js --agent "Bot1" --message "Test message"
  node demo_sender.js --count 5 --interval 2000
  node demo_sender.js --interactive
`)
        process.exit(0)
        break
    }
  }
  
  return options
}

// Generate topic hash
function generateTopicHash(topicName) {
  return crypto.createHash('sha256').update(topicName).digest()
}

// Create message payload
function createMessagePayload(options) {
  return {
    agent: options.agent,
    status: options.status,
    message: options.message,
    timestamp: new Date().toISOString(),
    metadata: {
      version: '1.0.0',
      platform: process.platform,
      nodeVersion: process.version
    }
  }
}

// Send message through socket
function sendMessage(socket, payload) {
  const jsonStr = JSON.stringify(payload)
  socket.write(jsonStr)
  logger.sent(`Message sent at ${new Date().toLocaleTimeString()}`)
  logger.info(`Payload: ${JSON.stringify(payload)}`)
}

// Interactive mode
async function interactiveMode(swarm, topic) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  
  console.log(`
${COLORS.BG_MAGENTA} INTERACTIVE MODE ${COLORS.RESET}
Type your message and press Enter to send.
Type 'status <status>' to change your status.
Type 'quit' or 'exit' to disconnect.
`)
  
  const agentName = `Agent-${crypto.randomBytes(4).toString('hex')}`
  let currentStatus = 'Active'
  
  const question = (prompt) => new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
  
  let activeSocket = null
  
  // Wait for connection
  swarm.on('connection', (socket, peerInfo) => {
    activeSocket = socket
    
    socket.on('data', (data) => {
      try {
        const response = JSON.parse(data.toString())
        if (response.type === 'ack') {
          logger.success(`Acknowledgment received from hub`)
        }
      } catch (e) {
        logger.debug(`Received: ${data.toString()}`)
      }
    })
    
    socket.on('close', () => {
      activeSocket = null
      logger.warn('Connection closed')
    })
  })
  
  // Main interactive loop
  while (true) {
    const input = await question(`${COLORS.BRIGHT}[${agentName}|${currentStatus}]${COLORS.RESET} > `)
    const trimmed = input.trim()
    
    if (!trimmed) continue
    
    // Handle commands
    if (trimmed.toLowerCase() === 'quit' || trimmed.toLowerCase() === 'exit') {
      console.log('')
      logger.info('Disconnecting...')
      rl.close()
      break
    }
    
    if (trimmed.toLowerCase().startsWith('status ')) {
      currentStatus = trimmed.slice(7).trim()
      logger.info(`Status changed to: ${currentStatus}`)
      continue
    }
    
    // Send message
    if (activeSocket) {
      const payload = {
        agent: agentName,
        status: currentStatus,
        message: trimmed,
        timestamp: new Date().toISOString()
      }
      sendMessage(activeSocket, payload)
    } else {
      logger.warn('No active connection. Waiting for hub...')
    }
  }
  
  return activeSocket
}

// Main function
async function main() {
  const options = parseArgs()
  
  console.log(`
${COLORS.BG_MAGENTA}${COLORS.BRIGHT}════════════════════════════════════════════════════════════════╗${COLORS.RESET}
${COLORS.BG_MAGENTA}${COLORS.BRIGHT}                AGENTBRIDGE DEMO SENDER v1.0                   ${COLORS.RESET}
${COLORS.BG_MAGENTA}${COLORS.BRIGHT}════════════════════════════════════════════════════════════════╝${COLORS.RESET}
`)
  
  logger.info(`Agent: ${options.agent}`)
  logger.info(`Status: ${options.status}`)
  logger.info(`Message: ${options.message}`)
  console.log('')
  
  logger.info('Initializing Hyperswarm...')
  
  const swarm = new Hyperswarm()
  const topic = generateTopicHash(CONFIG.TOPIC_NAME)
  
  logger.info(`Topic: ${CONFIG.TOPIC_NAME}`)
  logger.info(`Topic Hash: ${topic.toString('hex').slice(0, 32)}...`)
  
  // Track connections
  const connections = []
  let connectionCount = 0
  
  swarm.on('connection', (socket, peerInfo) => {
    const peerId = peerInfo.publicKey?.toString('hex').slice(0, 8) || 'unknown'
    connectionCount++
    connections.push(socket)
    logger.success(`Connected to peer: ${peerId}...`)
    
    // Handle acknowledgments
    socket.on('data', (data) => {
      try {
        const response = JSON.parse(data.toString())
        if (response.type === 'ack') {
          logger.success(`Acknowledgment received from hub: ${response.status}`)
        }
      } catch (e) {
        logger.info(`Hub response: ${data.toString()}`)
      }
    })
    
    socket.on('error', (err) => {
      logger.error(`Connection error: ${err.message}`)
    })
    
    socket.on('close', () => {
      logger.warn(`Connection closed: ${peerId}`)
    })
  })
  
  // Join topic
  logger.info('Joining AgentBridge network...')
  await swarm.join(topic, { server: false, client: true }).flush()
  
  // Wait for connections
  logger.info('Looking for peers...')
  
  // Give time to find peers
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  if (connections.length === 0) {
    logger.warn('No peers found yet. Waiting longer...')
    await new Promise(resolve => setTimeout(resolve, 3000))
  }
  
  if (connections.length === 0) {
    logger.error('Could not connect to any AgentBridge Hub.')
    logger.error('Make sure the hub (index.js) is running first.')
    logger.info('Run: node index.js')
    
    await swarm.destroy()
    process.exit(1)
  }
  
  logger.success(`Connected to ${connections.length} peer(s)`)
  console.log('')
  
  // Interactive mode
  if (options.interactive) {
    await interactiveMode(swarm, topic)
  } else {
    // Send messages
    for (let i = 0; i < options.count; i++) {
      const payload = createMessagePayload(options)
      
      // Add sequence number if sending multiple
      if (options.count > 1) {
        payload.sequence = `${i + 1}/${options.count}`
      }
      
      // Send to all connected peers
      for (const socket of connections) {
        sendMessage(socket, payload)
      }
      
      // Wait before next message
      if (i < options.count - 1) {
        await new Promise(resolve => setTimeout(resolve, options.interval))
      }
    }
  }
  
  // Cleanup
  console.log('')
  logger.info('Disconnecting from AgentBridge...')
  
  await swarm.leave(topic)
  await swarm.destroy()
  
  logger.success('Disconnected successfully')
}

// Handle shutdown
process.on('SIGINT', async () => {
  console.log('')
  logger.info('Interrupted. Cleaning up...')
  process.exit(0)
})

process.on('uncaughtException', (error) => {
  logger.error(`Error: ${error.message}`)
  process.exit(1)
})

// Run
main().catch((error) => {
  logger.error(`Failed: ${error.message}`)
  process.exit(1)
})
