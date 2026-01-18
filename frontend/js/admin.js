// Admin-specific functionality

// Using utilities from utils.js

document.addEventListener('DOMContentLoaded', function() {
  initAdminPage();
});

function initAdminPage() {
  // Initialize event handlers for admin page
  initAdminEventHandlers();
  
  // Load initial data
  loadSystemStats();
  loadUsers();
  loadGameHistory();
  loadSystemConfig();
  loadRecentActivity();
  
  // Update connection status
  checkConnectionStatus();
}

function initAdminEventHandlers() {
  // User management
  document.getElementById('show-add-user')?.addEventListener('click', showAddUserForm);
  document.getElementById('cancel-add-user')?.addEventListener('click', hideAddUserForm);
  document.getElementById('submit-new-user')?.addEventListener('click', createUser);
  document.getElementById('refresh-users')?.addEventListener('click', loadUsers);
  
  // Game history filters
  document.getElementById('apply-filters')?.addEventListener('click', loadGameHistory);
  
  // System configuration
  document.getElementById('save-config')?.addEventListener('click', saveSystemConfig);
}

// Load system statistics
async function loadSystemStats() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/stats`);
    const result = await response.json();
    
    if (response.ok) {
      document.getElementById('total-users').textContent = result.stats.totalUsers;
      document.getElementById('total-games').textContent = result.stats.totalGames;
      document.getElementById('active-games').textContent = result.stats.activeGames;
    } else {
      throw new Error(result.error || 'Failed to load system stats');
    }
  } catch (error) {
    console.error('Error loading system stats:', error);
    // Set default values
    document.getElementById('total-users').textContent = '0';
    document.getElementById('total-games').textContent = '0';
    document.getElementById('active-games').textContent = '0';
  }
}

// Load users list
async function loadUsers() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users`);
    const result = await response.json();
    
    if (response.ok) {
      renderUsersTable(result.users);
    } else {
      throw new Error(result.error || 'Failed to load users');
    }
  } catch (error) {
    console.error('Error loading users:', error);
    alert(`加载用户列表失败: ${error.message}`);
  }
}

// Render users in table
function renderUsersTable(users) {
  const tbody = document.getElementById('users-table-body');
  if (!tbody) return;
  
  // Clear existing rows
  tbody.innerHTML = '';
  
  // Add new rows
  users.forEach(user => {
    const row = document.createElement('tr');
    
    row.innerHTML = `
      <td>${user.id}</td>
      <td>${user.username}</td>
      <td>${user.email}</td>
      <td>${user.role}</td>
      <td>${new Date(user.createdAt).toLocaleString()}</td>
      <td>
        <button class="btn btn-sm btn-warning" onclick="editUser(${user.id})">编辑</button>
        <button class="btn btn-sm btn-danger" onclick="deleteUser(${user.id})">删除</button>
      </td>
    `;
    
    tbody.appendChild(row);
  });
}

// Show add user form
function showAddUserForm() {
  const formContainer = document.getElementById('add-user-form');
  if (formContainer) {
    formContainer.classList.remove('hidden');
  }
}

// Hide add user form
function hideAddUserForm() {
  const formContainer = document.getElementById('add-user-form');
  if (formContainer) {
    formContainer.classList.add('hidden');
    
    // Clear form
    document.getElementById('new-username').value = '';
    document.getElementById('new-email').value = '';
    document.getElementById('new-password').value = '';
    document.getElementById('new-role').value = 'operator';
  }
}

// Create new user
async function createUser() {
  const username = document.getElementById('new-username').value;
  const email = document.getElementById('new-email').value;
  const password = document.getElementById('new-password').value;
  const role = document.getElementById('new-role').value;
  
  if (!username || !email || !password) {
    alert('请填写所有必填字段');
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, email, password, role })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('User created:', result);
      alert('用户创建成功');
      hideAddUserForm();
      loadUsers(); // Refresh the list
    } else {
      throw new Error(result.error || 'Failed to create user');
    }
  } catch (error) {
    console.error('Error creating user:', error);
    alert(`创建用户失败: ${error.message}`);
  }
}

// Edit user (placeholder function)
function editUser(userId) {
  alert(`编辑用户功能 (ID: ${userId}) - 实际系统中会打开编辑对话框`);
}

// Delete user
async function deleteUser(userId) {
  if (!confirm('确定要删除此用户吗？')) {
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      method: 'DELETE'
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('User deleted:', result);
      alert('用户删除成功');
      loadUsers(); // Refresh the list
    } else {
      throw new Error(result.error || 'Failed to delete user');
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    alert(`删除用户失败: ${error.message}`);
  }
}

// Load game history
async function loadGameHistory() {
  try {
    // Get filter values
    const sportFilter = document.getElementById('sport-filter').value;
    const dateFrom = document.getElementById('date-from').value;
    const dateTo = document.getElementById('date-to').value;
    
    // Build query string
    const params = new URLSearchParams();
    if (sportFilter) params.append('sport', sportFilter);
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);
    
    const queryString = params.toString();
    const url = queryString ? 
      `${API_BASE_URL}/admin/games-history?${queryString}` : 
      `${API_BASE_URL}/admin/games-history`;
    
    const response = await fetch(url);
    const result = await response.json();
    
    if (response.ok) {
      renderGamesTable(result.games);
    } else {
      throw new Error(result.error || 'Failed to load game history');
    }
  } catch (error) {
    console.error('Error loading game history:', error);
    alert(`加载比赛历史失败: ${error.message}`);
  }
}

// Render games in table
function renderGamesTable(games) {
  const tbody = document.getElementById('games-table-body');
  if (!tbody) return;
  
  // Clear existing rows
  tbody.innerHTML = '';
  
  // Add new rows
  games.forEach(game => {
    const row = document.createElement('tr');
    
    row.innerHTML = `
      <td>${game.id || 'N/A'}</td>
      <td>${game.sport || 'N/A'}</td>
      <td>${game.teams && Array.isArray(game.teams) && game.teams[0] ? game.teams[0].name : 'N/A'}</td>
      <td>${game.teams && Array.isArray(game.teams) && game.teams[1] ? game.teams[1].name : 'N/A'}</td>
      <td>${game.score ? `${game.score.home}-${game.score.away}` : 'N/A'}</td>
      <td>${game.createdAt ? new Date(game.createdAt).toLocaleString() : 'N/A'}</td>
      <td>
        <button class="btn btn-sm btn-info" onclick="viewGame('${game.id}')">查看</button>
        <button class="btn btn-sm btn-primary" onclick="exportGameData('${game.id}')">导出</button>
      </td>
    `;
    
    tbody.appendChild(row);
  });
}

// View game details (placeholder)
function viewGame(gameId) {
  alert(`查看比赛详情 (ID: ${gameId}) - 实际系统中会打开详情页面`);
}

// Export game data
async function exportGameData(gameId) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/games/${gameId}/export`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      // Handle CSV download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `game_${gameId}_data.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } else {
      const result = await response.json();
      throw new Error(result.error || 'Failed to export game data');
    }
  } catch (error) {
    console.error('Error exporting game data:', error);
    alert(`导出比赛数据失败: ${error.message}`);
  }
}

// Load system configuration
async function loadSystemConfig() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/config`);
    const result = await response.json();
    
    if (response.ok) {
      const config = result.config;
      
      // Update system info
      document.getElementById('system-version').textContent = config.systemInfo.version;
      document.getElementById('node-version').textContent = config.systemInfo.nodeVersion;
      
      // Update feature toggles
      document.getElementById('basketball-enabled').checked = config.features.basketballEnabled;
      document.getElementById('soccer-enabled').checked = config.features.soccerEnabled;
      document.getElementById('analytics-enabled').checked = config.features.analyticsEnabled;
      document.getElementById('export-enabled').checked = config.features.exportEnabled;
    } else {
      throw new Error(result.error || 'Failed to load system config');
    }
  } catch (error) {
    console.error('Error loading system config:', error);
    // Set default values
    document.getElementById('system-version').textContent = '1.0.0';
    document.getElementById('node-version').textContent = 'Unknown';
  }
}

// Save system configuration
async function saveSystemConfig() {
  const config = {
    features: {
      basketballEnabled: document.getElementById('basketball-enabled').checked,
      soccerEnabled: document.getElementById('soccer-enabled').checked,
      analyticsEnabled: document.getElementById('analytics-enabled').checked,
      exportEnabled: document.getElementById('export-enabled').checked
    }
  };
  
  try {
    const response = await fetch(`${API_BASE_URL}/admin/config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(config)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('Config updated:', result);
      alert('系统配置已保存');
    } else {
      throw new Error(result.error || 'Failed to save config');
    }
  } catch (error) {
    console.error('Error saving config:', error);
    alert(`保存系统配置失败: ${error.message}`);
  }
}

// Load recent activity
async function loadRecentActivity() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/activity`);
    const result = await response.json();
    
    if (response.ok) {
      renderActivityList(result.activity);
    } else {
      throw new Error(result.error || 'Failed to load recent activity');
    }
  } catch (error) {
    console.error('Error loading recent activity:', error);
    // Use default static content if API fails
  }
}

// Render activity list
function renderActivityList(activityItems) {
  const container = document.getElementById('recent-activity');
  if (!container) return;
  
  // For now, we'll just use the static HTML content
  // In a real implementation, we would update the content dynamically
}

// Update users list display when notified by socket
function updateUsersList(users) {
  // Reload the user table to reflect changes
  loadUsers();
}