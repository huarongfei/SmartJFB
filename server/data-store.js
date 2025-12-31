/**
 * 核心数据存储
 * Core Data Store for Professional Sports Scoreboard System
 */

const { v4: uuidv4 } = require('uuid');

// 比赛状态枚举
const MatchStatus = {
  NOT_STARTED: 'not_started',
  PREPARING: 'preparing',
  LIVE: 'live',
  PAUSED: 'paused',
  FINISHED: 'finished'
};

// 运动类型枚举
const SportType = {
  BASKETBALL: 'basketball',
  FOOTBALL: 'football'
};

// 篮球规则配置
const BasketballRules = {
  // FIBA标准：4节，每节10分钟
  QUARTER_TIME: 600, // 10分钟 = 600秒
  QUARTERS: 4,
  OVERTIME_TIME: 300, // 加时赛5分钟
  TEAM_FOUL_LIMIT: 5, // 单节团队犯规限制
  FOULS_PER_QUARTER: 4, // 单节团队犯规达到后执行罚球
  PERSONAL_FOUL_LIMIT: 5, // 个人犯规限制
  SHOT_CLOCK: 24, // 24秒进攻时钟
  TIMEOUTS_PER_HALF: 2, // 每半场暂停次数
  TIMEOUT_DURATION: 60 // 暂停时长
};

// 足球规则配置
const FootballRules = {
  // 标准比赛：2个45分钟半场
  HALF_TIME: 2700, // 45分钟 = 2700秒
  HALVES: 2,
  EXTRA_TIME: 900, // 加时赛15分钟
  INJURY_TIME_ENABLED: true,
  STOPPAGE_TIME: 0, // 伤停补时（秒）
  TIMEOUT_DURATION: 120, // 暂停时长
  SUBSTITUTIONS_PER_HALF: 3 // 每半场换人次数
};

// 主数据存储类
class DataStore {
  constructor() {
    this.reset();
  }

  // 重置所有数据
  reset() {
    this.matchId = uuidv4();
    this.status = MatchStatus.NOT_STARTED;
    this.sportType = SportType.BASKETBALL;
    this.lastUpdate = Date.now();

    // 比赛时钟
    this.gameClock = {
      currentTime: BasketballRules.QUARTER_TIME,
      isCountDown: true, // true=倒计时, false=正计时
      isRunning: false,
      precision: 'millisecond', // second/minute/millisecond
      currentQuarter: 1,
      currentHalf: 1
    };

    // 进攻时钟（篮球）/控球时间（足球）
    this.shotClock = {
      currentTime: BasketballRules.SHOT_CLOCK,
      isRunning: false,
      maxTime: BasketballRules.SHOT_CLOCK,
      enabled: true
    };

    // 球队数据
    this.homeTeam = this.createTeamData();
    this.awayTeam = this.createTeamData();

    // 球权
    this.ballPossession = null; // 'home', 'away', or null

    // 比赛事件记录
    this.events = [];

    // 统计数据
    this.statistics = {
      home: this.createStatistics(),
      away: this.createStatistics()
    };

    // 广告管理
    this.ads = {
      currentAd: null,
      schedule: [],
      isPlaying: false
    };
  }

  // 创建球队数据
  createTeamData() {
    return {
      id: uuidv4(),
      name: '',
      logo: '',
      color: '#ffffff',
      score: 0,
      fouls: 0,
      timeOuts: 0,
      players: [],
      substitutes: [],
      roster: []
    };
  }

  // 创建球员数据
  createPlayerData(number, name, position = '') {
    return {
      id: uuidv4(),
      number: String(number),
      name: name,
      position: position,
      avatar: '',
      isInGame: true,
      statistics: {
        points: 0,
        goals: 0,
        assists: 0,
        rebounds: {
          offensive: 0,
          defensive: 0
        },
        steals: 0,
        blocks: 0,
        turnovers: 0,
        shots: {
          made: 0,
          missed: 0,
          attempts: 0
        },
        fouls: 0,
        yellowCards: 0,
        redCards: 0,
        minutesPlayed: 0
      }
    };
  }

  // 创建统计数据
  createStatistics() {
    return {
      totalShots: 0,
      madeShots: 0,
      fieldGoalPercentage: 0,
      threePointers: {
        attempts: 0,
        made: 0,
        percentage: 0
      },
      freeThrows: {
        attempts: 0,
        made: 0,
        percentage: 0
      },
      rebounds: {
        total: 0,
        offensive: 0,
        defensive: 0
      },
      assists: 0,
      steals: 0,
      blocks: 0,
      turnovers: 0,
      possessionPercentage: 0,
      shotsOnTarget: 0,
      shotsOffTarget: 0,
      corners: 0,
      offside: 0
    };
  }

  // 添加比赛事件
  addEvent(eventType, data) {
    const event = {
      id: uuidv4(),
      timestamp: Date.now(),
      gameTime: this.formatGameTime(),
      quarter: this.gameClock.currentQuarter,
      half: this.gameClock.currentHalf,
      type: eventType,
      ...data
    };

    this.events.push(event);
    this.lastUpdate = Date.now();

    return event;
  }

  // 格式化比赛时间
  formatGameTime() {
    const { currentTime, isCountDown, precision } = this.gameClock;

    if (isCountDown) {
      // 倒计时模式
      return this.formatTime(currentTime, precision);
    } else {
      // 正计时模式
      return this.formatTime(currentTime, precision);
    }
  }

  // 格式化时间
  formatTime(seconds, precision = 'second') {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    if (precision === 'millisecond') {
      const ms = Math.floor((seconds - Math.floor(seconds)) * 100);
      return `${minutes}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  }

  // 更新统计数据
  updateStatistics() {
    // 更新主队统计
    this.calculateTeamStatistics('home');
    // 更新客队统计
    this.calculateTeamStatistics('away');
    this.lastUpdate = Date.now();
  }

  // 计算球队统计
  calculateTeamStatistics(teamKey) {
    const team = this[teamKey];
    const stats = this.statistics[teamKey];

    // 计算总投篮命中率
    stats.totalShots = team.players.reduce((sum, p) =>
      sum + p.statistics.shots.attempts, 0);
    stats.madeShots = team.players.reduce((sum, p) =>
      sum + p.statistics.shots.made, 0);

    stats.fieldGoalPercentage = stats.totalShots > 0
      ? (stats.madeShots / stats.totalShots * 100).toFixed(1)
      : 0;

    // 计算三分球命中率
    stats.threePointers.attempts = team.players.reduce((sum, p) => {
      const threePointAttempts = p.statistics.shots.attempts;
      return sum + threePointAttempts;
    }, 0);

    stats.threePointers.made = team.players.reduce((sum, p) =>
      sum + p.statistics.shots.made, 0);

    stats.threePointers.percentage = stats.threePointers.attempts > 0
      ? (stats.threePointers.made / stats.threePointers.attempts * 100).toFixed(1)
      : 0;

    // 计算罚球命中率
    stats.freeThrows.attempts = team.players.reduce((sum, p) =>
      sum + p.statistics.shots.attempts, 0);

    stats.freeThrows.made = team.players.reduce((sum, p) =>
      sum + p.statistics.shots.made, 0);

    stats.freeThrows.percentage = stats.freeThrows.attempts > 0
      ? (stats.freeThrows.made / stats.freeThrows.attempts * 100).toFixed(1)
      : 0;

    // 篮板球
    stats.rebounds.total = team.players.reduce((sum, p) =>
      sum + p.statistics.rebounds.offensive + p.statistics.rebounds.defensive, 0);
    stats.rebounds.offensive = team.players.reduce((sum, p) =>
      sum + p.statistics.rebounds.offensive, 0);
    stats.rebounds.defensive = team.players.reduce((sum, p) =>
      sum + p.statistics.rebounds.defensive, 0);

    // 其他统计
    stats.assists = team.players.reduce((sum, p) => sum + p.statistics.assists, 0);
    stats.steals = team.players.reduce((sum, p) => sum + p.statistics.steals, 0);
    stats.blocks = team.players.reduce((sum, p) => sum + p.statistics.blocks, 0);
    stats.turnovers = team.players.reduce((sum, p) => sum + p.statistics.turnovers, 0);

    // 足球统计
    if (this.sportType === SportType.FOOTBALL) {
      stats.shotsOnTarget = team.players.reduce((sum, p) =>
        sum + p.statistics.shots.made, 0);
      stats.shotsOffTarget = team.players.reduce((sum, p) =>
        sum + p.statistics.shots.missed, 0);
    }
  }

  // 获取当前比赛信息
  getMatchInfo() {
    return {
      matchId: this.matchId,
      status: this.status,
      sportType: this.sportType,
      gameClock: this.gameClock,
      shotClock: this.shotClock,
      homeTeam: this.homeTeam,
      awayTeam: this.awayTeam,
      ballPossession: this.ballPossession,
      events: this.events,
      statistics: this.statistics,
      lastUpdate: this.lastUpdate
    };
  }
}

// 创建全局数据存储实例
const dataStore = new DataStore();

module.exports = {
  DataStore,
  dataStore,
  MatchStatus,
  SportType,
  BasketballRules,
  FootballRules
};
