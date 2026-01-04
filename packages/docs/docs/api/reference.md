# API Reference

The EscrowKit API provides REST endpoints to query indexed data.

## Base URL

\`http://localhost:3000\`

## Endpoints

### \`GET /escrows\`
List all escrows.
- **Query Params**: \`party\` (address filter)

### \`GET /escrows/:address\`
Get details of a specific escrow.

### \`GET /escrows/:address/milestones\`
Get milestones for an escrow.

### \`GET /escrows/:address/events\`
Get full event history.
