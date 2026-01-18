// 判罚管理系统的主逻辑
document.addEventListener('DOMContentLoaded', async function() {
  // 初始化页面
  initializePenaltyManagement();

  // 绑定事件处理器
  bindEventHandlers();
});

async function initializePenaltyManagement() {
  try {
    // 初始化比赛列表
    await refreshGamesList();
    
    // 设置当前时间显示
    updatePenaltyTimeDisplay();
    
    // 设置定时器定期更新时间
    setInterval(updatePenaltyTimeDisplay, 1000);
    
    // 加载判罚记录
    await loadPenalties();
    
    // 加载统计信息
    await loadPenaltyStats();
  } catch (error) {
    console.error('初始化判罚管理系统失败:', error);
  }
}

function bindEventHandlers() {
  // 记录判罚按钮
  document.getElementById('record-penalty').addEventListener('click', recordPenalty);
  
  // 重置表单按钮
  document.getElementById('reset-form').addEventListener('click', resetPenaltyForm);
  
  // 刷新判罚记录按钮
  document.getElementById('refresh-penalties').addEventListener('click', loadPenalties);
  
  // 导出记录按钮
  document.getElementById('export-penalties').addEventListener('click', exportPenalties);
  
  // 监听比赛选择变化
  document.getElementById('active-games').addEventListener('change', handleGameSelection);
}

function updatePenaltyTimeDisplay() {
  // 尝试从游戏时钟获取时间，如果不可用则显示当前时间
  const timeDisplay = document.getElementById('penalty-time');
  if (window.getCurrentGameTime) {
    timeDisplay.value = window.getCurrentGameTime();
  } else {
    // 如果没有可用的游戏时钟，显示当前时间
    const now = new Date();
    timeDisplay.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }
}

async function recordPenalty() {
  const gameId = document.getElementById('active-games').value;
  const team = document.getElementById('team-select').value;
  const playerNumber = document.getElementById('player-number').value;
  const penaltyType = document.getElementById('penalty-type').value;
  const penaltyTime = document.getElementById('penalty-time').value;
  const referee = document.getElementById('referee').value;
  const notes = document.getElementById('penalty-notes').value;

  // 验证必填字段
  if (!gameId) {
    alert('请选择比赛');
    return;
  }
  
  if (!playerNumber) {
    alert('请输入球员号码');
    return;
  }
  
  if (!penaltyType) {
    alert('请选择判罚类型');
    return;
  }

  try {
    // 发送请求记录判罚
    const response = await fetch(`${API_BASE_URL}/penalties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        gameId,
        team,
        playerNumber: parseInt(playerNumber),
        penaltyType,
        penaltyTime,
        referee,
        notes,
        timestamp: new Date().toISOString()
      })
    });

    const result = await response.json();

    if (response.ok) {
      alert('判罚记录成功');
      resetPenaltyForm();
      await loadPenalties();
      await loadPenaltyStats();
      
      // 广播给其他客户端
      if (window.socket) {
        window.socket.emit('penalty_recorded', result.penalty);
      }
    } else {
      throw new Error(result.error || '记录判罚失败');
    }
  } catch (error) {
    console.error('记录判罚失败:', error);
    alert(`记录判罚失败: ${error.message}`);
  }
}

function resetPenaltyForm() {
  document.getElementById('player-number').value = '';
  document.getElementById('penalty-type').value = '';
  document.getElementById('referee').value = '';
  document.getElementById('penalty-notes').value = '';
  updatePenaltyTimeDisplay(); // 重新设置时间为当前时间
}

async function loadPenalties() {
  try {
    const gameId = document.getElementById('active-games').value;
    
    if (!gameId) {
      // 如果没有选择比赛，清空表格
      document.getElementById('penalties-table-body').innerHTML = '';
      return;
    }

    const response = await fetch(`${API_BASE_URL}/penalties?gameId=${encodeURIComponent(gameId)}`);
    const data = await response.json();

    if (response.ok) {
      renderPenaltiesTable(data.penalties || []);
    } else {
      throw new Error(data.error || '加载判罚记录失败');
    }
  } catch (error) {
    console.error('加载判罚记录失败:', error);
    alert(`加载判罚记录失败: ${error.message}`);
  }
}

function renderPenaltiesTable(penalties) {
  const tbody = document.getElementById('penalties-table-body');
  
  if (!penalties || penalties.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7">暂无判罚记录</td></tr>';
    return;
  }

  tbody.innerHTML = penalties.map(penalty => `
    <tr data-penalty-id="${penalty.id}">
      <td>${penalty.penaltyTime || '-'}</td>
      <td>${penalty.team === 'home' ? '主队' : '客队'}</td>
      <td>#${penalty.playerNumber}</td>
      <td>${getPenaltyTypeName(penalty.penaltyType)}</td>
      <td>${penalty.notes || '-'}</td>
      <td>${penalty.referee || '-'}</td>
      <td>
        <button class="btn btn-sm btn-danger" onclick="deletePenalty('${penalty.id}')">删除</button>
      </td>
    </tr>
  `).join('');
}

function getPenaltyTypeName(type) {
  const names = {
    'foul-personal': '个人犯规',
    'foul-technical': '技术犯规',
    'foul-flagrant': '恶意犯规',
    'violation': '违例',
    'ejection': '驱逐出场',
    'warning': '警告'
  };
  return names[type] || type;
}

async function deletePenalty(penaltyId) {
  if (!confirm('确定要删除这条判罚记录吗？')) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/penalties/${penaltyId}`, {
      method: 'DELETE'
    });

    const result = await response.json();

    if (response.ok) {
      alert('判罚记录删除成功');
      await loadPenalties();
      await loadPenaltyStats();
      
      // 广播给其他客户端
      if (window.socket) {
        window.socket.emit('penalty_deleted', { id: penaltyId });
      }
    } else {
      throw new Error(result.error || '删除判罚记录失败');
    }
  } catch (error) {
    console.error('删除判罚记录失败:', error);
    alert(`删除判罚记录失败: ${error.message}`);
  }
}

async function loadPenaltyStats() {
  try {
    const gameId = document.getElementById('active-games').value;
    
    if (!gameId) {
      // 如果没有选择比赛，重置统计数据
      document.getElementById('home-fouls').textContent = '0';
      document.getElementById('away-fouls').textContent = '0';
      document.getElementById('total-penalties').textContent = '0';
      return;
    }

    const response = await fetch(`${API_BASE_URL}/penalties/stats?gameId=${encodeURIComponent(gameId)}`);
    const data = await response.json();

    if (response.ok) {
      document.getElementById('home-fouls').textContent = data.homeFouls || 0;
      document.getElementById('away-fouls').textContent = data.awayFouls || 0;
      document.getElementById('total-penalties').textContent = data.totalPenalties || 0;
      document.getElementById('current-period').textContent = data.currentPeriod || 1;
    } else {
      throw new Error(data.error || '加载统计信息失败');
    }
  } catch (error) {
    console.error('加载统计信息失败:', error);
  }
}

function handleGameSelection() {
  // 当选择不同比赛时，重新加载判罚记录和统计信息
  loadPenalties();
  loadPenaltyStats();
}

function exportPenalties() {
  const gameId = document.getElementById('active-games').value;
  
  if (!gameId) {
    alert('请选择比赛');
    return;
  }

  // 创建下载链接
  const link = document.createElement('a');
  link.href = `${API_BASE_URL}/penalties/export?gameId=${encodeURIComponent(gameId)}`;
  link.download = `penalties_${gameId}_${new Date().toISOString().slice(0, 19)}.csv`;
  link.click();
}

// 将函数添加到window对象，以便在HTML中可以调用
window.deletePenalty = deletePenalty;