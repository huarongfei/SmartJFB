// Analytics-specific functionality

// Chart instances
let scoreChart, shootingChart, momentumChart;

document.addEventListener('DOMContentLoaded', function() {
  initAnalyticsPage();
});

function initAnalyticsPage() {
  // Initialize event handlers for analytics page
  initAnalyticsEventHandlers();
  
  // Initialize charts
  initCharts();
  
  // Update connection status
  checkConnectionStatus();
}

function initAnalyticsEventHandlers() {
  // Game selection
  document.getElementById('active-games')?.addEventListener('change', loadGameStats);
  document.getElementById('refresh-games')?.addEventListener('click', refreshGamesList);
  
  // Export buttons
  document.getElementById('export-csv')?.addEventListener('click', () => exportStats('csv'));
  document.getElementById('export-pdf')?.addEventListener('click', () => exportStats('pdf'));
  document.getElementById('export-full-report')?.addEventListener('click', () => exportStats('full'));
}

function initCharts() {
  // Initialize score chart
  const scoreCtx = document.getElementById('scoreChart').getContext('2d');
  scoreChart = new Chart(scoreCtx, {
    type: 'line',
    data: {
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      datasets: [{
        label: '主队得分',
        data: [20, 25, 18, 22],
        borderColor: '#3498db',
        backgroundColor: 'rgba(52, 152, 219, 0.1)',
        tension: 0.1
      }, {
        label: '客队得分',
        data: [18, 22, 20, 19],
        borderColor: '#e74c3c',
        backgroundColor: 'rgba(231, 76, 60, 0.1)',
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });

  // Initialize shooting chart
  const shootingCtx = document.getElementById('shootingChart').getContext('2d');
  shootingChart = new Chart(shootingCtx, {
    type: 'bar',
    data: {
      labels: ['FG%', '3P%', 'FT%'],
      datasets: [{
        label: '主队',
        data: [48.5, 38.2, 85.7],
        backgroundColor: 'rgba(52, 152, 219, 0.7)'
      }, {
        label: '客队',
        data: [45.3, 35.8, 82.1],
        backgroundColor: 'rgba(231, 76, 60, 0.7)'
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          max: 100
        }
      }
    }
  });

  // Initialize momentum chart
  const momentumCtx = document.getElementById('momentumChart').getContext('2d');
  momentumChart = new Chart(momentumCtx, {
    type: 'line',
    data: {
      labels: ['0-5', '5-10', '10-15', '15-20', '20-25', '25-30', '30-35', '35-40'],
      datasets: [{
        label: '主队势头',
        data: [65, 70, 60, 75, 80, 70, 65, 75],
        borderColor: '#3498db',
        fill: false
      }, {
        label: '客队势头',
        data: [35, 30, 40, 25, 20, 30, 35, 25],
        borderColor: '#e74c3c',
        fill: false
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          max: 100
        }
      }
    }
  });
}

// Load statistics for selected game
async function loadGameStats() {
  const gameId = document.getElementById('active-games').value;
  
  if (!gameId) return;
  
  try {
    const response = await fetch(`${API_BASE_URL}/analytics/games/${gameId}/stats`);
    const result = await response.json();
    
    if (response.ok) {
      updateStatsDisplay(result.stats);
      gameState.currentGameId = gameId;
    } else {
      throw new Error(result.error || 'Failed to load game statistics');
    }
  } catch (error) {
    console.error('Error loading game stats:', error);
    alert(`加载统计数据失败: ${error.message}`);
  }
}

// Refresh list of active games
async function refreshGamesList() {
  try {
    // Using the advanced timers endpoint to get active games
    const response = await fetch(`${API_BASE_URL}/advanced-timers`);
    const result = await response.json();
    
    if (response.ok) {
      updateGamesList(result.timers);
    } else {
      throw new Error(result.error || 'Failed to refresh games list');
    }
  } catch (error) {
    console.error('Error refreshing games list:', error);
    alert(`刷新比赛列表失败: ${error.message}`);
  }
}

// Update games dropdown with active games
function updateGamesList(timers) {
  const gamesSelect = document.getElementById('active-games');
  // Clear existing options except the first one
  gamesSelect.innerHTML = '<option value="">请选择比赛...</option>';
  
  for (const [gameId, timer] of Object.entries(timers)) {
    const option = document.createElement('option');
    option.value = gameId;
    option.textContent = `比赛 ${gameId.substring(0, 8)} - ${timer.sport}`;
    gamesSelect.appendChild(option);
  }
}

// Update statistics display
function updateStatsDisplay(stats) {
  if (!stats) return;
  
  const basicStats = stats.basic || {};
  const advancedStats = stats.advanced || {};
  
  // Update basic stats
  document.getElementById('home-total-score').textContent = basicStats.scores?.home?.points || 0;
  document.getElementById('away-total-score').textContent = basicStats.scores?.away?.points || 0;
  
  // Update shooting percentages
  document.getElementById('home-shooting-pct').textContent = basicStats.scores?.home?.percentage || '0%';
  document.getElementById('away-shooting-pct').textContent = basicStats.scores?.away?.percentage || '0%';
  
  // Update rebounds
  document.getElementById('home-rebounds').textContent = basicStats.rebounds?.home || 0;
  document.getElementById('away-rebounds').textContent = basicStats.rebounds?.away || 0;
  
  // Update assists
  document.getElementById('home-assists').textContent = basicStats.assists?.home || 0;
  document.getElementById('away-assists').textContent = basicStats.assists?.away || 0;
  
  // Update steals
  document.getElementById('home-steals').textContent = basicStats.steals?.home || 0;
  document.getElementById('away-steals').textContent = basicStats.steals?.away || 0;
  
  // Update blocks
  document.getElementById('home-blocks').textContent = basicStats.blocks?.home || 0;
  document.getElementById('away-blocks').textContent = basicStats.blocks?.away || 0;
  
  // Update advanced metrics
  document.getElementById('home-per').textContent = advancedStats.efficiency?.home || '0.0';
  document.getElementById('away-per').textContent = advancedStats.efficiency?.away || '0.0';
  
  // Update four factors
  if (advancedStats.fourFactors) {
    document.getElementById('home-efg').textContent = (advancedStats.fourFactors.efg?.home || 0).toFixed(1) + '%';
    document.getElementById('away-efg').textContent = (advancedStats.fourFactors.efg?.away || 0).toFixed(1) + '%';
    
    document.getElementById('home-tov').textContent = (advancedStats.fourFactors.tov?.home || 0).toFixed(1) + '%';
    document.getElementById('away-tov').textContent = (advancedStats.fourFactors.tov?.away || 0).toFixed(1) + '%';
    
    document.getElementById('home-orb').textContent = (advancedStats.fourFactors.orb?.home || 0).toFixed(1) + '%';
    document.getElementById('away-orb').textContent = (advancedStats.fourFactors.orb?.away || 0).toFixed(1) + '%';
    
    document.getElementById('home-ftr').textContent = (advancedStats.fourFactors.ftRate?.home || 0).toFixed(1) + '%';
    document.getElementById('away-ftr').textContent = (advancedStats.fourFactors.ftRate?.away || 0).toFixed(1) + '%';
  }
}

// Export statistics in different formats
async function exportStats(format) {
  const gameId = gameState.currentGameId;
  
  if (!gameId) {
    alert('请先选择比赛');
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/analytics/games/${gameId}/export/${format}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      if (format === 'csv') {
        // Handle CSV download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `game_${gameId}_stats.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else if (format === 'pdf') {
        // For PDF, we'd normally handle the download differently
        // Actual PDF export implementation
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `game_${gameId}_stats.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // Full report
        alert('完整报告生成已触发（实际系统中会下载综合报告）');
      }
    } else {
      const result = await response.json();
      throw new Error(result.error || `Failed to export stats in ${format} format`);
    }
  } catch (error) {
    console.error(`Error exporting stats (${format}):`, error);
    alert(`导出统计数据失败: ${error.message}`);
  }
}

// Update charts with new data
function updateChartsWithData(stats) {
  if (!stats) return;
  
  // Update score chart with actual data
  if (scoreChart) {
    // This would be updated with actual quarter-by-quarter scores
    scoreChart.data.datasets[0].data = stats.quarterlyScores?.home || [0, 0, 0, 0];
    scoreChart.data.datasets[1].data = stats.quarterlyScores?.away || [0, 0, 0, 0];
    scoreChart.update();
  }
  
  // Update shooting chart with actual data
  if (shootingChart) {
    shootingChart.data.datasets[0].data = stats.shootingPercentages?.home || [0, 0, 0];
    shootingChart.data.datasets[1].data = stats.shootingPercentages?.away || [0, 0, 0];
    shootingChart.update();
  }
  
  // Update momentum chart with actual data
  if (momentumChart) {
    momentumChart.data.datasets[0].data = stats.momentum?.home || [0, 0, 0, 0, 0, 0, 0, 0];
    momentumChart.data.datasets[1].data = stats.momentum?.away || [0, 0, 0, 0, 0, 0, 0, 0];
    momentumChart.update();
  }
}