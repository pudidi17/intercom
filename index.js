/**
 * AgentBridge - Cross-Platform AI Agent Communication Hub
 * Main entry point for Pear runtime
 */

const { AgentBridge } = require('./lib/agentbridge')

async function main () {
  const bridge = new AgentBridge()
  
  // Start the bridge
  await bridge.start()
  
  console.log('[AgentBridge] Started successfully')
  console.log('[AgentBridge] Entry channel: 0000intercom')
  console.log('[AgentBridge] Bridge channel: agentbridge-main')
}

main().catch(err => {
  console.error('[AgentBridge] Error:', err)
  process.exit(1)
})
