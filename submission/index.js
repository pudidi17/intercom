#!/usr/bin/env node

/**
 * AgentBridge Hub - Cross-Platform AI Agent Communication Hub
 * 
 * A decentralized P2P communication network for AI agents.
 * Built on Hyperswarm DHT for NAT traversal and peer discovery.
 * 
 * Competition: Trac Systems Intercom Vibe Competition
 * Repository: https://github.com/Trac-Systems/intercom
 * 
 * @author AgentBridge Team
 * @version 1.0.0
 */

import Hyperswarm from 'hyperswarm'
import crypto from 'crypto'
import { createRequire } from 'module'

// Configuration
const CONFIG = {
  TOPIC_NAME: 'agent-bridge-v1',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  HEARTBEAT_INTERVAL: 30000, // 30 seconds
  VERSION: '1.0.0'
}

// ANSI color codes for terminal output
const COLORS = {
  RESET: '\x1b[0m',
  BRIGHT: '\x1b[1m',
  DIM: '\x1b[2m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  MAGENTA: '\x1b[35m',
  CYAN: '\x1b[36m',
  RED: '\x1b[31m',
  BG_BLUE: '\x1b[44m',
  BG_CYAN: '\x1b[46m'
}

// Banner display
function displayBanner() {
  console.log(`
${COLORS.BG_BLUE}${COLORS.BRIGHT}════════════════════════════════════════════════════════════════╗${COLORS.RESET}
${COLORS.BG_BLUE}${COLORS.BRIGHT}                     AGENTBRIDGE HUB v${CONFIG.VERSION}                     ${COLORS.RESET}
${COLORS.BG_BLUE}${COLORS.BRIGHT}              Cross-Platform AI Agent Communication           ${COLORS.RESET}
${COLORS.BG_BLUE}${COLORS.BRIGHT}════════════════════════════════════════════════════════════════╝${COLORS.RESET}
`)
}

// Logging utilities
const logger = {
  info: (msg) => console.log(`${COLORS.CYAN}[INFO]${COLORS.RESET} ${msg}`),
  success: (msg) => console.log(`${COLORS.GREEN}[OK]${COLORS.RESET} ${msg}`),
  warn: (msg) => console.log(`${COLORS.YELLOW}[WARN]${COLORS.RESET} ${msg}`),
  error: (msg) => console.log(`${COLORS.RED}[ERROR]${COLORS.RESET} ${msg}`),
  msg: (msg) => console.log(`${COLORS.MAGENTA}[MSG]${COLORS.RESET} ${msg}`),
  peer: (msg) => console.log(`${COLORS.BLUE}[PEER]${COLORS.RESET} ${msg}`),
  debug: (msg) => {
    if (CONFIG.LOG_LEVEL === 'debug') {
      console.log(`${COLORS.DIM}[DEBUG]${COLORS.RESET} ${msg}`)
    }
  }
}

// Statistics tracking
const stats = {
  startTime: Date.now(),
  totalConnections: 0,
  activeConnections: 0,
  messagesReceived: 0,
  messagesSent: 0
}

// Connected peers map
const connectedPeers = new Map()

// Message history (last 100 messages)
const messageHistory = []
const MAX_HISTORY = 100

/**
 * Generate topic hash from topic name
 */
function generateTopicHash(topicName) {
  return crypto.createHash('sha256').update(topicName).digest()
}

/**
 * Format timestamp for display
 */
function formatTimestamp(isoString) {
  try {
    const date = new Date(isoString)
    return date.toLocaleString()
  } catch {
    return isoString
  }
}

/**
 * Parse and validate incoming message
 */
function parseMessage(data) {
  try {
    const message = JSON.parse(data.toString())
    
    // Basic validation
    if (!message.agent && !message.sender) {
      return { valid: false, error: 'Missing agent/sender field' }
    }
    
    return { valid: true, message }
  } catch (error) {
    return { valid: false, error: error.message }
  }
}

/**
 * Format and display received message
 */
function displayMessage(msg, peerId) {
  stats.messagesReceived++
  
  // Add to history
  const historyEntry = {
    timestamp: new Date().toISOString(),
    peerId: peerId?.slice(0, 8) || 'unknown',
    message: msg
  }
  messageHistory.push(historyEntry)
  if (messageHistory.length > MAX_HISTORY) {
    messageHistory.shift()
  }
  
  // Display formatted message
  console.log('')
  console.log(`${COLORS.BG_CYAN} MESSAGE RECEIVED ${COLORS.RESET}`)
  console.log(`${COLORS.BRIGHT}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.RESET}`)
  
  if (msg.sender) {
    console.log(`  ${COLORS.CYAN}From:${COLORS.RESET}      ${msg.sender.name || msg.sender.id || 'Unknown'}`)
    if (msg.sender.capabilities) {
      console.log(`  ${COLORS.CYAN}Capabilities:${COLORS.RESET} ${msg.sender.capabilities.join(', ')}`)
    }
  } else if (msg.agent) {
    console.log(`  ${COLORS.CYAN}From:${COLORS.RESET}      ${msg.agent}`)
  }
  
  if (msg.type) {
    console.log(`  ${COLORS.CYAN}Type:${COLORS.RESET}      ${msg.type}`)
  }
  
  if (msg.status) {
    console.log(`  ${COLORS.CYAN}Status:${COLORS.RESET}    ${msg.status}`)
  }
  
  if (msg.message) {
    console.log(`  ${COLORS.CYAN}Message:${COLORS.RESET}   ${msg.message}`)
  }
  
  if (msg.payload) {
    const payloadStr = typeof msg.payload === 'object' 
      ? JSON.stringify(msg.payload, null, 2) 
      : msg.payload
    console.log(`  ${COLORS.CYAN}Payload:${COLORS.RESET}`)
    console.log(`    ${payloadStr}`)
  }
  
  console.log(`  ${COLORS.CYAN}Timestamp:${COLORS.RESET} ${formatTimestamp(msg.timestamp || new Date().toISOString())}`)
  console.log(`  ${COLORS.CYAN}Peer ID:${COLORS.RESET}  ${peerId?.slice(0, 16) || 'unknown'}...`)
  console.log(`${COLORS.BRIGHT}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.RESET}`)
  console.log('')
}

/**
 * Display current statistics
 */
function displayStats() {
  const uptime = Math.floor((Date.now() - stats.startTime) / 1000)
  const hours = Math.floor(uptime / 3600)
  const minutes = Math.floor((uptime % 3600) / 60)
  const seconds = uptime % 60
  
  console.log('')
  console.log(`${COLORS.BRIGHT}═════════════════ HUB STATISTICS ═════════════════${COLORS.RESET}`)
  console.log(`  Uptime:              ${hours}h ${minutes}m ${seconds}s`)
  console.log(`  Active Connections:  ${stats.activeConnections}`)
  console.log(`  Total Connections:   ${stats.totalConnections}`)
  console.log(`  Messages Received:   ${stats.messagesReceived}`)
  console.log(`  Messages Sent:       ${stats.messagesSent}`)
  console.log(`  Connected Peers:     ${connectedPeers.size}`)
  console.log(`${COLORS.BRIGHT}══════════════════════════════════════════════════${COLORS.RESET}`)
  console.log('')
}

/**
 * Handle incoming peer connection
 */
function handleConnection(socket, peerInfo) {
  const peerId = peerInfo.publicKey?.toString('hex') || 'unknown-peer'
  const shortPeerId = peerId.slice(0, 8)
  
  stats.totalConnections++
  stats.activeConnections++
  connectedPeers.set(peerId, {
    connectedAt: new Date().toISOString(),
    messagesReceived: 0
  })
  
  logger.peer(`New connection from peer: ${shortPeerId}...`)
  logger.info(`Active connections: ${stats.activeConnections}`)
  
  // Handle incoming data
  socket.on('data', (data) => {
    logger.debug(`Raw data received: ${data.toString().slice(0, 100)}...`)
    
    const result = parseMessage(data)
    
    if (result.valid) {
      displayMessage(result.message, peerId)
      
      // Update peer stats
      const peer = connectedPeers.get(peerId)
      if (peer) {
        peer.messagesReceived++
        peer.lastMessage = new Date().toISOString()
      }
      
      // Send acknowledgment
      const ack = {
        type: 'ack',
        status: 'received',
        timestamp: new Date().toISOString(),
        hubVersion: CONFIG.VERSION
      }
      socket.write(JSON.stringify(ack))
      stats.messagesSent++
      
    } else {
      logger.warn(`Invalid message from ${shortPeerId}: ${result.error}`)
    }
  })
  
  // Handle connection errors
  socket.on('error', (err) => {
    logger.error(`Connection error with peer ${shortPeerId}: ${err.message}`)
  })
  
  // Handle connection close
  socket.on('close', () => {
    stats.activeConnections--
    connectedPeers.delete(peerId)
    logger.peer(`Peer disconnected: ${shortPeerId}...`)
    logger.info(`Active connections: ${stats.activeConnections}`)
  })
}

/**
 * Heartbeat to maintain connections and display stats
 */
function startHeartbeat() {
  setInterval(() => {
    logger.debug(`Heartbeat: ${stats.activeConnections} active connections`)
    
    // Display stats every 5 minutes
    const uptime = Math.floor((Date.now() - stats.startTime) / 1000)
    if (uptime > 0 && uptime % 300 === 0) {
      displayStats()
    }
  }, CONFIG.HEARTBEAT_INTERVAL)
}

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(swarm, topic) {
  console.log('')
  logger.info('Shutting down AgentBridge Hub...')
  
  // Display final statistics
  displayStats()
  
  try {
    await swarm.leave(topic)
    logger.info('Left topic successfully')
    
    await swarm.destroy()
    logger.success('Hyperswarm destroyed')
    
    logger.success('AgentBridge Hub shutdown complete')
    process.exit(0)
  } catch (error) {
    logger.error(`Shutdown error: ${error.message}`)
    process.exit(1)
  }
}

/**
 * Main entry point - Start the AgentBridge Hub
 */
async function startHub() {
  // Display banner
  displayBanner()
  
  logger.info('Initializing Hyperswarm DHT...')
  
  // Create Hyperswarm instance
  const swarm = new Hyperswarm()
  
  // Generate topic hash
  const topic = generateTopicHash(CONFIG.TOPIC_NAME)
  
  logger.info(`Topic Name: ${CONFIG.TOPIC_NAME}`)
  logger.info(`Topic Hash: ${topic.toString('hex').slice(0, 32)}...`)
  
  // Handle incoming connections
  swarm.on('connection', (socket, peerInfo) => {
    handleConnection(socket, peerInfo)
  })
  
  // Join the topic as both server and client
  logger.info('Joining topic as server and client...')
  await swarm.join(topic, { server: true, client: true }).flush()
  
  logger.success('AgentBridge Hub is ONLINE')
  logger.info('Waiting for agent connections...')
  logger.info('Press Ctrl+C to shutdown')
  console.log('')
  
  // Start heartbeat
  startHeartbeat()
  
  // Handle graceful shutdown
  process.on('SIGINT', () => gracefulShutdown(swarm, topic))
  process.on('SIGTERM', () => gracefulShutdown(swarm, topic))
  
  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    logger.error(`Uncaught exception: ${error.message}`)
    logger.debug(error.stack)
  })
  
  process.on('unhandledRejection', (reason, promise) => {
    logger.error(`Unhandled rejection: ${reason}`)
  })
}

// Export for module usage
export {
  startHub,
  parseMessage,
  displayMessage,
  displayStats,
  generateTopicHash,
  CONFIG
}

// Run if executed directly
startHub().catch((error) => {
  logger.error(`Failed to start AgentBridge Hub: ${error.message}`)
  process.exit(1)
})
