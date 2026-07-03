import '../style.css';
const { INVENTORY_ITEMS, APPROVAL_REQUESTS, CHAT_HISTORIES, INTEGRATION_LOGS, PERSONAS } = require('../data/workflow_demo_data');

function escapeHtml(unsafe) {
  if (typeof unsafe !== 'string') return unsafe;
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderInventoryPanel() {
  return `
    <div class="demo-card">
      <h3 class="demo-card-title">Inventory Overview</h3>
      <table class="demo-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Category</th>
            <th>Stock Level</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${INVENTORY_ITEMS.map(item => `
            <tr>
              <td><strong>${escapeHtml(item.name)}</strong></td>
              <td>${escapeHtml(item.category)}</td>
              <td>${item.stockLevel}</td>
              <td>
                <span class="demo-badge ${item.stockLevel <= item.reorderLevel ? 'demo-badge--warning' : 'demo-badge--success'}">
                  ${item.stockLevel <= item.reorderLevel ? 'Reorder Needed' : 'In Stock'}
                </span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderApprovalsPanel() {
  return `
    <div class="demo-card">
      <h3 class="demo-card-title">Pending Approvals</h3>
      <div class="demo-approvals-list">
        ${APPROVAL_REQUESTS.map(req => {
          const item = INVENTORY_ITEMS.find(i => i.id === req.itemId);
          return `
            <div class="demo-approval-item">
              <div class="demo-approval-header">
                <strong>Request for ${req.quantity}x ${escapeHtml(item.name)}</strong>
                <span class="demo-badge demo-badge--pending">${escapeHtml(req.status)}</span>
              </div>
              <div class="demo-approval-steps">
                ${req.workflowSteps.map(step => `
                  <div class="demo-approval-step ${step.status === 'Approved' ? 'approved' : ''}">
                    <div class="step-indicator"></div>
                    <div class="step-details">
                      <span>${escapeHtml(step.actorRole)}</span>
                      <small>${escapeHtml(step.status)}</small>
                    </div>
                  </div>
                `).join('')}
              </div>
              <button class="demo-button demo-button--primary" onclick="alert('In a live environment, this would trigger the automated approval flow!')">Approve Request</button>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderIntegrationPanel() {
  return `
    <div class="demo-card">
      <h3 class="demo-card-title">Department Integration Hub</h3>
      <table class="demo-table">
        <thead>
          <tr>
            <th>Connected System</th>
            <th>Last Sync</th>
            <th>Activity</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${INTEGRATION_LOGS.map(log => {
            const timeString = new Date(log.lastRun).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return `
            <tr>
              <td><strong>${escapeHtml(log.system)}</strong></td>
              <td>${timeString}</td>
              <td>${escapeHtml(log.detail)}</td>
              <td>
                <span class="demo-badge ${log.status === 'Synced' ? 'demo-badge--success' : 'demo-badge--pending'}">
                  ${escapeHtml(log.status)}
                </span>
              </td>
            </tr>
            `;
          }).join('')}
        </tbody>
      </table>
      <div style="margin-top: 1rem; text-align: right;">
        <button class="demo-button demo-button--primary" onclick="alert('In a live environment, this would manually trigger an API sync with external systems!')">Sync Now</button>
      </div>
    </div>
  `;
}

function renderChatPanel() {
  const chat = CHAT_HISTORIES[0];
  return `
    <div class="demo-card demo-chat">
      <h3 class="demo-card-title">Internal Chat</h3>
      <div class="demo-chat-messages">
        ${chat.messages.map(msg => {
          const isSender = msg.senderId === PERSONAS.STAFF_MEMBER.id;
          const participant = Object.values(PERSONAS).find(p => p.id === msg.senderId);
          return `
            <div class="demo-message ${isSender ? 'demo-message--self' : 'demo-message--other'}">
              <div class="demo-message-bubble">
                <div class="demo-message-sender">${escapeHtml(participant.name)}</div>
                <div class="demo-message-text">${escapeHtml(msg.text)}</div>
                <div class="demo-message-time">${new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
      <div class="demo-chat-input">
        <input type="text" placeholder="Type a message..." disabled />
        <button class="demo-button demo-button--primary" disabled>Send</button>
      </div>
    </div>
  `;
}

function renderDemoView() {
  return `
    <div class="demo-layout no-print">
      <aside class="demo-sidebar">
        <div class="demo-sidebar-header">
          Workflow OS
        </div>
        <nav class="demo-nav">
          <a class="demo-nav-item active">Dashboard</a>
          <a class="demo-nav-item" onclick="alert('Demo placeholder: navigates to full inventory view')">Inventory</a>
          <a class="demo-nav-item" onclick="alert('Demo placeholder: navigates to approvals queue')">Approvals</a>
          <a class="demo-nav-item" onclick="alert('Demo placeholder: navigates to department integrations')">Integrations</a>
          <a class="demo-nav-item" onclick="alert('Demo placeholder: opens full screen chat')">Chat</a>
          <div style="flex:1"></div>
          <a class="demo-nav-item" style="margin-top: 2rem;" onclick="window.location.href='/'">← Back to Quoting</a>
        </nav>
      </aside>

      <main class="demo-main">
        <div class="demo-wrapper">
          <div class="demo-header">
            <div>
              <h2 class="demo-heading">Live Platform Preview</h2>
              <p class="demo-subheading">This is what your customized Workflow Management System will look like.</p>
            </div>
          </div>
          
          <div class="demo-dashboard">
            <div class="demo-column">
              ${renderInventoryPanel()}
              ${renderApprovalsPanel()}
            </div>
            <div class="demo-column">
              ${renderIntegrationPanel()}
              ${renderChatPanel()}
            </div>
          </div>
        </div>
      </main>
    </div>
  `;
}

function init() {
  const root = document.getElementById('demo-root');
  if (root) {
    root.innerHTML = renderDemoView();
  }
}

document.addEventListener('DOMContentLoaded', init);
