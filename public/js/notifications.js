const toastContainer = document.getElementById('toastContainer');

export function showToast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, duration);
}

const notificationButton = document.getElementById('notificationBtn');
const notificationBadge = notificationButton ? notificationButton.querySelector('.notification-badge') : null;
const notificationPanelId = 'notificationPanel';

let notifications = [];
let unreadCount = 0;

export function addNotification(message, type = 'info') {
  const id = Date.now();
  const notification = { id, message, type, read: false, timestamp: new Date() };
  notifications.unshift(notification);
  unreadCount++;
  updateBadge();
  renderNotificationPanel();
  showToast(message, type);
}

export function markAllAsRead() {
  notifications = notifications.map(n => ({ ...n, read: true }));
  unreadCount = 0;
  updateBadge();
  renderNotificationPanel();
}

export function getUnreadCount() {
  return unreadCount;
}

function updateBadge() {
  if (!notificationBadge) return;
  if (unreadCount > 0) {
    notificationBadge.textContent = unreadCount;
    notificationBadge.style.display = 'inline-block';
  } else {
    notificationBadge.style.display = 'none';
  }
}

function renderNotificationPanel() {
  let panel = document.getElementById(notificationPanelId);
  if (!panel) {
    panel = document.createElement('div');
    panel.id = notificationPanelId;
    panel.className = 'notification-panel';
    document.body.appendChild(panel);
  }
  if (notifications.length === 0) {
    panel.innerHTML = '<div class="notification-empty">Aucune notification</div>';
    return;
  }
  panel.innerHTML = notifications.map(n => `
    <div class="notification-item ${n.read ? 'read' : 'unread'} notification-${n.type}">
      <div class="notification-message">${n.message}</div>
      <div class="notification-timestamp">${n.timestamp.toLocaleString()}</div>
    </div>
  `).join('');
}

export function toggleNotificationPanel() {
  const panel = document.getElementById(notificationPanelId);
  if (!panel) return;
  if (panel.style.display === 'block') {
    panel.style.display = 'none';
  } else {
    panel.style.display = 'block';
  }
}

export function closeNotificationPanel() {
  const panel = document.getElementById(notificationPanelId);
  if (panel) {
    panel.style.display = 'none';
  }
}

export function initNotifications() {
  if (!notificationButton) return;
  notificationButton.addEventListener('click', () => {
    toggleNotificationPanel();
    markAllAsRead();
  });
  document.addEventListener('click', (event) => {
    const panel = document.getElementById(notificationPanelId);
    if (!panel) return;
    if (!notificationButton.contains(event.target) && !panel.contains(event.target)) {
      closeNotificationPanel();
    }
  });
}

updateBadge();
