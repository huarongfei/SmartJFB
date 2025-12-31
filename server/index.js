/**
 * 专业体育比分系统 - 主服务器
 * Professional Sports Scoreboard System - Main Server
 *
 * 功能：
 * 1. WebSocket实时通信
 * 2. RESTful API
 * 3. 数据持久化
 * 4. 多屏幕支持
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const { dataStore, MatchStatus, SportType } = require('./data-store');
const TimerController = require('./timer-controller');
const ExportService = require('./export-service');
const AdvertisementService = require('./ad-service');
const LayoutService = require('./layout-service');

// 初始化应用
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// 配置
const API_PORT = process.env.API_PORT || 3001;
const FRONTEND_PORT = process.env.FRONTEND_PORT || 3000;

// 初始化计时控制器
const timerController = new TimerController(dataStore);

// 初始化导出服务
const exportService = new ExportService(dataStore);

// 初始化广告服务
const adService = new AdvertisementService(dataStore);

// 初始化布局服务
const layoutService = new LayoutService();

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// 存储连接的客户端
const connectedClients = new Map();

// ==================== Socket.IO ====================

io.on('connection', (socket) => {
  console.log('客户端连接:', socket.id);

  // 保存客户端信息
  connectedClients.set(socket.id, {
    socket,
    type: 'unknown', // 'admin', 'scoreboard', 'statistics', 'monitor'
    connectedAt: Date.now()
  });

  // 发送当前比赛数据
  socket.emit('initial_data', dataStore.getMatchInfo());

  // 发送计时器状态
  socket.emit('timer_update', timerController.getTimerStatus());

  // 注册客户端类型
  socket.on('register_client', (clientType) => {
    const client = connectedClients.get(socket.id);
    if (client) {
      client.type = clientType;
      console.log('客户端注册:', socket.id, clientType);
    }
  });

  // 断开连接
  socket.on('disconnect', () => {
    connectedClients.delete(socket.id);
    console.log('客户端断开:', socket.id);
  });
});

// 广播数据更新
function broadcastUpdate(data) {
  io.emit('data_update', data);
}

// 广播计时器更新
function broadcastTimerUpdate(data) {
  io.emit('timer_update', data);
}

// ==================== RESTful API ====================

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    connectedClients: connectedClients.size
  });
});

// 获取完整比赛数据
app.get('/api/match', (req, res) => {
  res.json({
    success: true,
    data: dataStore.getMatchInfo()
  });
});

// 获取计时器状态
app.get('/api/timer', (req, res) => {
  res.json({
    success: true,
    data: timerController.getTimerStatus()
  });
});

// 设置运动类型
app.post('/api/sport', (req, res) => {
  const { sportType } = req.body;

  if (!Object.values(SportType).includes(sportType)) {
    return res.json({
      success: false,
      message: '无效的运动类型'
    });
  }

  dataStore.sportType = sportType;
  timerController.resetGameClock();

  broadcastUpdate({ sportType });
  res.json({
    success: true,
    message: '运动类型已设置',
    data: { sportType }
  });
});

// ==================== 比赛控制 API ====================

// 开始比赛时钟
app.post('/api/timer/start', (req, res) => {
  timerController.startGameClock();
  broadcastTimerUpdate(timerController.getTimerStatus());

  dataStore.addEvent('game_start', {
    sport: dataStore.sportType
  });

  res.json({ success: true, message: '比赛已开始' });
});

// 暂停比赛时钟
app.post('/api/timer/pause', (req, res) => {
  timerController.pauseGameClock();
  broadcastTimerUpdate(timerController.getTimerStatus());

  dataStore.addEvent('game_pause', {
    gameTime: dataStore.formatGameTime()
  });

  res.json({ success: true, message: '比赛已暂停' });
});

// 停止比赛时钟
app.post('/api/timer/stop', (req, res) => {
  timerController.stopGameClock();
  broadcastTimerUpdate(timerController.getTimerStatus());

  res.json({ success: true, message: '比赛已停止' });
});

// 复位比赛时钟
app.post('/api/timer/reset', (req, res) => {
  timerController.resetGameClock();
  broadcastTimerUpdate(timerController.getTimerStatus());

  res.json({ success: true, message: '比赛时钟已复位' });
});

// 单节/半场结束
app.post('/api/timer/end-quarter', (req, res) => {
  timerController.endQuarterOrHalf();
  broadcastTimerUpdate(timerController.getTimerStatus());

  res.json({ success: true, message: '节/半场已结束' });
});

// 设置比赛时间
app.post('/api/timer/set-time', (req, res) => {
  const { seconds } = req.body;

  timerController.setGameTime(seconds);
  broadcastTimerUpdate(timerController.getTimerStatus());

  res.json({ success: true, message: '时间已设置' });
});

// 切换倒计时/正计时
app.post('/api/timer/toggle-direction', (req, res) => {
  timerController.toggleCountDown();
  broadcastTimerUpdate(timerController.getTimerStatus());

  res.json({
    success: true,
    message: '计时方向已切换',
    isCountDown: dataStore.gameClock.isCountDown
  });
});

// 设置计时精度
app.post('/api/timer/set-precision', (req, res) => {
  const { precision } = req.body; // 'second', 'minute', 'millisecond'

  dataStore.gameClock.precision = precision;
  broadcastTimerUpdate(timerController.getTimerStatus());

  res.json({ success: true, message: '计时精度已设置' });
});

// ==================== 进攻时钟 API ====================

// 开始进攻时钟
app.post('/api/shot-clock/start', (req, res) => {
  timerController.startShotClock();
  broadcastTimerUpdate(timerController.getTimerStatus());

  res.json({ success: true, message: '进攻时钟已开始' });
});

// 暂停进攻时钟
app.post('/api/shot-clock/pause', (req, res) => {
  timerController.pauseShotClock();
  broadcastTimerUpdate(timerController.getTimerStatus());

  res.json({ success: true, message: '进攻时钟已暂停' });
});

// 复位进攻时钟
app.post('/api/shot-clock/reset', (req, res) => {
  timerController.resetShotClock();
  broadcastTimerUpdate(timerController.getTimerStatus());

  res.json({ success: true, message: '进攻时钟已复位' });
});

// 设置进攻时钟时间
app.post('/api/shot-clock/set-time', (req, res) => {
  const { seconds } = req.body;

  timerController.setShotClockMaxTime(seconds);
  broadcastTimerUpdate(timerController.getTimerStatus());

  res.json({ success: true, message: '进攻时钟已设置' });
});

// 设置进攻时钟（简化版）
app.post('/api/shot-clock/set', (req, res) => {
  const { seconds } = req.body;

  timerController.setShotClockTime(seconds);
  timerController.startShotClock();
  broadcastTimerUpdate(timerController.getTimerStatus());

  res.json({ success: true, message: '进攻时钟已设置' });
});

// ==================== 比分控制 API ====================

// 更新比分
app.post('/api/score', (req, res) => {
  const { team, points, operation } = req.body; // operation: 'add' | 'subtract'

  const teamData = team === 'home'
    ? dataStore.homeTeam
    : dataStore.awayTeam;

  if (operation === 'add') {
    teamData.score += points;
  } else if (operation === 'subtract') {
    teamData.score = Math.max(0, teamData.score - points);
  }

  dataStore.updateStatistics();
  broadcastUpdate({ scores: {
    home: dataStore.homeTeam.score,
    away: dataStore.awayTeam.score
  }});

  res.json({ success: true, message: '比分已更新' });
});

// 重置比分
app.post('/api/score/reset', (req, res) => {
  dataStore.homeTeam.score = 0;
  dataStore.awayTeam.score = 0;
  dataStore.updateStatistics();

  broadcastUpdate({ scores: { home: 0, away: 0 }});
  res.json({ success: true, message: '比分已重置' });
});

// ==================== 球队管理 API ====================

// 更新球队信息
app.post('/api/team/update', (req, res) => {
  const { team, data } = req.body; // team: 'home' | 'away'

  const teamData = team === 'home'
    ? dataStore.homeTeam
    : dataStore.awayTeam;

  Object.assign(teamData, data);
  dataStore.lastUpdate = Date.now();

  broadcastUpdate({
    [`${team}Team`]: teamData
  });

  res.json({ success: true, message: '球队信息已更新' });
});

// 添加球员
app.post('/api/player/add', (req, res) => {
  const { team, playerData } = req.body;

  const teamData = team === 'home'
    ? dataStore.homeTeam
    : dataStore.awayTeam;

  const player = dataStore.createPlayerData(
    playerData.number,
    playerData.name,
    playerData.position
  );

  teamData.players.push(player);
  dataStore.lastUpdate = Date.now();

  broadcastUpdate({
    [`${team}Team`]: teamData
  });

  res.json({ success: true, message: '球员已添加', data: player });
});

// 删除球员
app.delete('/api/player/:team/:playerId', (req, res) => {
  const { team, playerId } = req.params;

  const teamData = team === 'home'
    ? dataStore.homeTeam
    : dataStore.awayTeam;

  teamData.players = teamData.players.filter(p => p.id !== playerId);
  dataStore.lastUpdate = Date.now();

  broadcastUpdate({
    [`${team}Team`]: teamData
  });

  res.json({ success: true, message: '球员已删除' });
});

// 更新球员数据
app.put('/api/player/:playerId', (req, res) => {
  const { playerId } = req.params;
  const { updates } = req.body;

  // 查找球员
  let player = dataStore.homeTeam.players.find(p => p.id === playerId);
  let teamKey = 'home';

  if (!player) {
    player = dataStore.awayTeam.players.find(p => p.id === playerId);
    teamKey = 'away';
  }

  if (!player) {
    return res.json({ success: false, message: '球员未找到' });
  }

  Object.assign(player, updates);
  dataStore.lastUpdate = Date.now();

  broadcastUpdate({
    [`${teamKey}Team`]: dataStore[`${teamKey}Team`]
  });

  res.json({ success: true, message: '球员数据已更新' });
});

// ==================== 比赛事件 API ====================

// 记录比赛事件
app.post('/api/event', (req, res) => {
  const { eventType, data } = req.body;

  const event = dataStore.addEvent(eventType, data);

  // 根据事件类型更新数据
  handleEvent(eventType, data);

  dataStore.updateStatistics();
  broadcastUpdate({
    events: dataStore.events,
    statistics: dataStore.statistics
  });

  res.json({ success: true, message: '事件已记录', data: event });
});

// 删除事件
app.delete('/api/event/:eventId', (req, res) => {
  const { eventId } = req.params;

  dataStore.events = dataStore.events.filter(e => e.id !== eventId);
  dataStore.lastUpdate = Date.now();

  broadcastUpdate({
    events: dataStore.events
  });

  res.json({ success: true, message: '事件已删除' });
});

// 获取所有事件
app.get('/api/events', (req, res) => {
  res.json({
    success: true,
    data: dataStore.events
  });
});

// 清空所有事件
app.delete('/api/events', (req, res) => {
  dataStore.events = [];
  dataStore.lastUpdate = Date.now();

  broadcastUpdate({
    events: dataStore.events
  });

  res.json({ success: true, message: '事件已清空' });
});

// 更新队伍名称
app.put('/api/teams/home', (req, res) => {
  const { name } = req.body;
  if (name) {
    dataStore.homeTeam.name = name;
    dataStore.lastUpdate = Date.now();

    broadcastUpdate({
      matchInfo: dataStore.getMatchInfo()
    });

    res.json({ success: true, message: '主队名称已更新', data: dataStore.homeTeam });
  } else {
    res.json({ success: false, message: '队名不能为空' });
  }
});

app.put('/api/teams/away', (req, res) => {
  const { name } = req.body;
  if (name) {
    dataStore.awayTeam.name = name;
    dataStore.lastUpdate = Date.now();

    broadcastUpdate({
      matchInfo: dataStore.getMatchInfo()
    });

    res.json({ success: true, message: '客队名称已更新', data: dataStore.awayTeam });
  } else {
    res.json({ success: false, message: '队名不能为空' });
  }
});

// 调整比分
app.post('/api/teams/score', (req, res) => {
  const { team, points } = req.body;
  const teamData = team === 'home' ? dataStore.homeTeam : dataStore.awayTeam;

  if (teamData) {
    teamData.score = Math.max(0, teamData.score + points);
    dataStore.lastUpdate = Date.now();

    broadcastUpdate({
      matchInfo: dataStore.getMatchInfo()
    });

    res.json({ success: true, message: '比分已调整' });
  } else {
    res.json({ success: false, message: '队伍未找到' });
  }
});

// 添加/减少时间
app.post('/api/timer/add', (req, res) => {
  const { seconds } = req.body;
  timerController.addTime(seconds);
  broadcastTimerUpdate(timerController.getTimerStatus());

  res.json({ success: true, message: '时间已调整' });
});

// 获取比赛信息
app.get('/api/match-info', (req, res) => {
  res.json({
    success: true,
    data: dataStore.getMatchInfo()
  });
});

// 添加球员（新接口）
app.post('/api/teams/:team/players', (req, res) => {
  const { team } = req.params;
  const { number, name } = req.body;

  const teamData = team === 'home' ? dataStore.homeTeam : dataStore.awayTeam;

  if (!teamData) {
    return res.json({ success: false, message: '队伍未找到' });
  }

  const player = {
    id: `player_${Date.now()}`,
    number: number || '?',
    name: name || '未知球员',
    position: '',
    statistics: {
      points: 0,
      fouls: 0,
      assists: 0,
      rebounds: 0,
      steals: 0,
      blocks: 0,
      fieldGoals: { made: 0, attempts: 0 },
      threePointers: { made: 0, attempts: 0 },
      freeThrows: { made: 0, attempts: 0 }
    }
  };

  teamData.players.push(player);
  dataStore.lastUpdate = Date.now();

  broadcastUpdate({
    matchInfo: dataStore.getMatchInfo()
  });

  res.json({ success: true, message: '球员已添加', data: player });
});

// 删除球员（新接口）
app.delete('/api/teams/:team/players/:index', (req, res) => {
  const { team, index } = req.params;

  const teamData = team === 'home' ? dataStore.homeTeam : dataStore.awayTeam;

  if (!teamData) {
    return res.json({ success: false, message: '队伍未找到' });
  }

  const playerIndex = parseInt(index);
  if (playerIndex >= 0 && playerIndex < teamData.players.length) {
    const removed = teamData.players.splice(playerIndex, 1);
    dataStore.lastUpdate = Date.now();

    broadcastUpdate({
      matchInfo: dataStore.getMatchInfo()
    });

    res.json({ success: true, message: '球员已删除', data: removed[0] });
  } else {
    res.json({ success: false, message: '球员索引无效' });
  }
});

// 按索引删除事件
app.delete('/api/events/:index', (req, res) => {
  const { index } = req.params;
  const eventIndex = parseInt(index);

  if (eventIndex >= 0 && eventIndex < dataStore.events.length) {
    dataStore.events.splice(eventIndex, 1);
    dataStore.lastUpdate = Date.now();

    broadcastUpdate({
      events: dataStore.events
    });

    res.json({ success: true, message: '事件已删除' });
  } else {
    res.json({ success: false, message: '事件索引无效' });
  }
});

// 处理事件并更新数据
function handleEvent(eventType, data) {
  switch (eventType) {
    case 'score_basketball':
      // 篮球得分
      const { team, player, points, type } = data;
      const teamData = team === 'home' ? dataStore.homeTeam : dataStore.awayTeam;
      teamData.score += points;

      if (player) {
        const playerData = teamData.players.find(p => p.id === player.id);
        if (playerData) {
          playerData.statistics.points += points;
          playerData.statistics.shots.attempts++;
          playerData.statistics.shots.made++;
        }
      }
      break;

    case 'score_football':
      // 足球进球
      const { team: fTeam, player: fPlayer } = data;
      const fTeamData = fTeam === 'home' ? dataStore.homeTeam : dataStore.awayTeam;
      fTeamData.score++;

      if (fPlayer) {
        const fPlayerData = fTeamData.players.find(p => p.id === fPlayer.id);
        if (fPlayerData) {
          fPlayerData.statistics.goals++;
        }
      }
      break;

    case 'foul':
      // 犯规
      const { team: foulTeam, player: foulPlayer, type: foulType } = data;
      const foulTeamData = foulTeam === 'home' ? dataStore.homeTeam : dataStore.awayTeam;
      foulTeamData.fouls++;

      if (foulPlayer) {
        const foulPlayerData = foulTeamData.players.find(p => p.id === foulPlayer.id);
        if (foulPlayerData) {
          foulPlayerData.statistics.fouls++;
        }
      }
      break;

    case 'yellow_card':
      // 黄牌
      const { team: yTeam, player: yPlayer } = data;
      const yTeamData = yTeam === 'home' ? dataStore.homeTeam : dataStore.awayTeam;

      if (yPlayer) {
        const yPlayerData = yTeamData.players.find(p => p.id === yPlayer.id);
        if (yPlayerData) {
          yPlayerData.statistics.yellowCards++;
        }
      }
      break;

    case 'red_card':
      // 红牌
      const { team: rTeam, player: rPlayer } = data;
      const rTeamData = rTeam === 'home' ? dataStore.homeTeam : dataStore.awayTeam;

      if (rPlayer) {
        const rPlayerData = rTeamData.players.find(p => p.id === rPlayer.id);
        if (rPlayerData) {
          rPlayerData.statistics.redCards++;
          rPlayerData.isInGame = false; // 罚下场
        }
      }
      break;
  }
}

// ==================== 重置 API ====================

// 重置比赛
app.post('/api/reset', (req, res) => {
  dataStore.reset();
  timerController.resetGameClock();

  broadcastUpdate(dataStore.getMatchInfo());

  res.json({ success: true, message: '比赛已重置' });
});

// ==================== 导出功能 API ====================

// 导出比赛摘要
app.post('/api/export/summary', async (req, res) => {
  try {
    const { format } = req.body; // 'excel', 'csv', 'pdf'
    const filepath = await exportService.exportMatchSummary(format);

    const filename = path.basename(filepath);
    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('下载错误:', err);
      }
    });
  } catch (error) {
    console.error('导出错误:', error);
    res.status(500).json({
      success: false,
      message: '导出失败',
      error: error.message
    });
  }
});

// 导出球队统计
app.post('/api/export/team-stats', async (req, res) => {
  try {
    const { format } = req.body;
    const filepath = await exportService.exportTeamStatistics(format);

    const filename = path.basename(filepath);
    res.download(filepath, filename);
  } catch (error) {
    console.error('导出错误:', error);
    res.status(500).json({
      success: false,
      message: '导出失败',
      error: error.message
    });
  }
});

// 导出球员统计
app.post('/api/export/player-stats', async (req, res) => {
  try {
    const { format } = req.body;
    const filepath = await exportService.exportPlayerStatistics(format);

    const filename = path.basename(filepath);
    res.download(filepath, filename);
  } catch (error) {
    console.error('导出错误:', error);
    res.status(500).json({
      success: false,
      message: '导出失败',
      error: error.message
    });
  }
});

// 导出 Play-by-Play
app.post('/api/export/playbyplay', async (req, res) => {
  try {
    const { format } = req.body;
    const filepath = await exportService.exportPlayByPlay(format);

    const filename = path.basename(filepath);
    res.download(filepath, filename);
  } catch (error) {
    console.error('导出错误:', error);
    res.status(500).json({
      success: false,
      message: '导出失败',
      error: error.message
    });
  }
});

// 导出所有数据
app.post('/api/export/all', async (req, res) => {
  try {
    const { format } = req.body;
    const filepath = await exportService.exportAllData(format);

    const filename = path.basename(filepath);
    res.download(filepath, filename);
  } catch (error) {
    console.error('导出错误:', error);
    res.status(500).json({
      success: false,
      message: '导出失败',
      error: error.message
    });
  }
});

// 获取可用的导出格式
app.get('/api/export/formats', (req, res) => {
  res.json({
    success: true,
    data: ['excel', 'csv', 'pdf']
  });
});

// ==================== 广告管理 API ====================

// 获取所有广告
app.get('/api/ads', (req, res) => {
  res.json({
    success: true,
    data: adService.getAllAds()
  });
});

// 获取启用的广告
app.get('/api/ads/enabled', (req, res) => {
  res.json({
    success: true,
    data: adService.getEnabledAds()
  });
});

// 按位置获取广告
app.get('/api/ads/position/:position', (req, res) => {
  const { position } = req.params;
  res.json({
    success: true,
    data: adService.getAdsByPosition(position)
  });
});

// 添加广告
app.post('/api/ads', async (req, res) => {
  try {
    const ad = await adService.addAd(req.body);
    broadcastUpdate({ ads: adService.getAllAds() });
    res.json({
      success: true,
      message: '广告已添加',
      data: ad
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 更新广告
app.put('/api/ads/:adId', async (req, res) => {
  try {
    const ad = await adService.updateAd(req.params.adId, req.body);
    broadcastUpdate({ ads: adService.getAllAds() });
    res.json({
      success: true,
      message: '广告已更新',
      data: ad
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 删除广告
app.delete('/api/ads/:adId', async (req, res) => {
  try {
    await adService.deleteAd(req.params.adId);
    broadcastUpdate({ ads: adService.getAllAds() });
    res.json({
      success: true,
      message: '广告已删除'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 启用/禁用广告
app.post('/api/ads/:adId/toggle', async (req, res) => {
  try {
    const { enabled } = req.body;
    await adService.toggleAd(req.params.adId, enabled);
    broadcastUpdate({ ads: adService.getAllAds() });
    res.json({
      success: true,
      message: enabled ? '广告已启用' : '广告已禁用'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 获取广告统计
app.get('/api/ads/:adId/statistics', (req, res) => {
  try {
    const stats = adService.getAdStatistics(req.params.adId);
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 获取所有广告统计
app.get('/api/ads/statistics/all', (req, res) => {
  res.json({
    success: true,
    data: adService.getAllStatistics()
  });
});

// 重置广告统计
app.post('/api/ads/statistics/reset', async (req, res) => {
  await adService.resetStatistics();
  res.json({
    success: true,
    message: '广告统计已重置'
  });
});

// 获取下一个广告
app.get('/api/ads/next/:position', (req, res) => {
  const ad = adService.getNextAd(req.params.position);
  res.json({
    success: true,
    data: ad
  });
});

// 记录广告播放
app.post('/api/ads/:adId/play', async (req, res) => {
  try {
    await adService.recordAdPlay(req.params.adId);
    res.json({
      success: true,
      message: '广告播放已记录'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 获取预设广告模板
app.get('/api/ads/templates', (req, res) => {
  res.json({
    success: true,
    data: adService.getPresetTemplates()
  });
});

// ==================== 布局管理 API ====================

// 获取所有布局
app.get('/api/layouts', (req, res) => {
  res.json({
    success: true,
    data: layoutService.getAllLayouts()
  });
});

// 按运动类型获取布局
app.get('/api/layouts/sport/:sportType', (req, res) => {
  const { sportType } = req.params;
  res.json({
    success: true,
    data: layoutService.getLayoutsBySport(sportType)
  });
});

// 获取当前布局
app.get('/api/layouts/current', (req, res) => {
  const layout = layoutService.getCurrentLayout();
  res.json({
    success: true,
    data: layout
  });
});

// 创建布局
app.post('/api/layouts', async (req, res) => {
  try {
    const layout = await layoutService.createLayout(req.body);
    broadcastUpdate({ layouts: layoutService.getAllLayouts() });
    res.json({
      success: true,
      message: '布局已创建',
      data: layout
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 更新布局
app.put('/api/layouts/:layoutId', async (req, res) => {
  try {
    const layout = await layoutService.updateLayout(req.params.layoutId, req.body);
    broadcastUpdate({ layouts: layoutService.getAllLayouts() });
    res.json({
      success: true,
      message: '布局已更新',
      data: layout
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 删除布局
app.delete('/api/layouts/:layoutId', async (req, res) => {
  try {
    await layoutService.deleteLayout(req.params.layoutId);
    broadcastUpdate({ layouts: layoutService.getAllLayouts() });
    res.json({
      success: true,
      message: '布局已删除'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 复制布局
app.post('/api/layouts/:layoutId/duplicate', async (req, res) => {
  try {
    const { name } = req.body;
    const layout = await layoutService.duplicateLayout(req.params.layoutId, name);
    broadcastUpdate({ layouts: layoutService.getAllLayouts() });
    res.json({
      success: true,
      message: '布局已复制',
      data: layout
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 设置当前布局
app.post('/api/layouts/current', async (req, res) => {
  try {
    const { layoutId } = req.body;
    const layout = await layoutService.setCurrentLayout(layoutId);
    broadcastUpdate({ currentLayout: layout });
    res.json({
      success: true,
      message: '当前布局已设置',
      data: layout
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 验证布局
app.post('/api/layouts/validate', (req, res) => {
  const validation = layoutService.validateLayout(req.body);
  res.json({
    success: validation.valid,
    data: validation
  });
});

// 导出布局
app.get('/api/layouts/:layoutId/export', async (req, res) => {
  try {
    const filepath = await layoutService.exportLayout(req.params.layoutId);
    const filename = path.basename(filepath);
    res.download(filepath, filename);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 获取布局模板
app.get('/api/layouts/templates', (req, res) => {
  res.json({
    success: true,
    data: layoutService.getLayoutTemplates()
  });
});

// ==================== 前端服务 ====================

// 主页
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ==================== 启动服务器 ====================

server.listen(API_PORT, () => {
  console.log('========================================');
  console.log('专业体育比分系统 - Professional Sports Scoreboard System');
  console.log('========================================');
  console.log('');
  console.log('服务器信息:');
  console.log(`  API服务器: http://localhost:${API_PORT}`);
  console.log(`  WebSocket: ws://localhost:${API_PORT}`);
  console.log('');
  console.log('启动服务器:');
  console.log(`  node server/index.js`);
  console.log('');
  console.log('访问应用:');
  console.log(`  主页: http://localhost:${API_PORT}`);
  console.log(`  记分牌: http://localhost:${API_PORT}/scoreboard.html`);
  console.log(`  管理面板: http://localhost:${API_PORT}/admin.html`);
  console.log(`  统计面板: http://localhost:${API_PORT}/statistics.html`);
  console.log('');
  console.log('========================================');
});

module.exports = { app, server, io };
