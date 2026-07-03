const PERSONAS = {
  STORE_MANAGER: { id: 'usr_001', name: 'Marcus Storeman', role: 'Store Manager', department: 'Inventory' },
  DEPARTMENT_HEAD: { id: 'usr_002', name: 'Sarah Lead', role: 'Department Head', department: 'IT' },
  FINANCE_EXEC: { id: 'usr_003', name: 'Felix Cash', role: 'Finance Executive', department: 'Finance' },
  STAFF_MEMBER: { id: 'usr_004', name: 'Emma Worker', role: 'Staff Member', department: 'IT' },
};

const INVENTORY_ITEMS = [
  { id: 'item_001', name: 'ThinkPad T14 Gen 3', category: 'Electronics', stockLevel: 15, reorderLevel: 5 },
  { id: 'item_002', name: 'Ergonomic Office Chair', category: 'Furniture', stockLevel: 4, reorderLevel: 10 },
  { id: 'item_003', name: 'Logitech MX Master 3S', category: 'Accessories', stockLevel: 25, reorderLevel: 10 },
];

const APPROVAL_REQUESTS = [
  {
    id: 'req_001',
    requesterId: PERSONAS.STAFF_MEMBER.id,
    itemId: 'item_001',
    quantity: 1,
    status: 'Pending',
    createdAt: new Date().toISOString(),
    workflowSteps: [
      { step: 1, actorRole: 'Department Head', status: 'Pending' },
      { step: 2, actorRole: 'Store Manager', status: 'Pending' }
    ]
  },
];

const CHAT_HISTORIES = [
  {
    channelId: 'chan_001',
    participants: [PERSONAS.STAFF_MEMBER.id, PERSONAS.DEPARTMENT_HEAD.id],
    messages: [
      { senderId: PERSONAS.STAFF_MEMBER.id, text: "Hi Sarah, my laptop is acting up. I just submitted a request for a new ThinkPad.", timestamp: "2026-07-03T08:00:00Z" },
      { senderId: PERSONAS.DEPARTMENT_HEAD.id, text: "I see it, Emma. I'll approve it right now via the Approval Automation tab.", timestamp: "2026-07-03T08:05:00Z" }
    ]
  }
];

const INTEGRATION_LOGS = [
  { id: 'int_001', system: 'Workday HR', status: 'Synced', lastRun: new Date(Date.now() - 3600000).toISOString(), detail: 'Employee roster updated' },
  { id: 'int_002', system: 'SAP Finance', status: 'Pending', lastRun: new Date().toISOString(), detail: 'Budget clearance for req_001' },
  { id: 'int_003', system: 'Procurement API', status: 'Synced', lastRun: new Date(Date.now() - 86400000).toISOString(), detail: 'Vendor catalog refreshed' },
];

module.exports = {
  PERSONAS,
  INVENTORY_ITEMS,
  APPROVAL_REQUESTS,
  CHAT_HISTORIES,
  INTEGRATION_LOGS,
};
