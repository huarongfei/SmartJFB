/**
 * 核心计时控制器
 * Core Timer Controller for Professional Sports Scoreboard System
 * 提供毫秒级精度的计时功能
 */

class TimerController {
  constructor(dataStore) {
    this.dataStore = dataStore;
    this.gameClockInterval = null;
    this.shotClockInterval = null;
    this.tickRate = 10; // 10ms一次tick，实现毫秒级精度
    this.lastTick = Date.now();
    this.elapsedTime = 0;
    this.shotClockElapsedTime = 0; // 进攻时钟累计时间
  }

  // 开始比赛时钟
  startGameClock() {
    if (this.dataStore.gameClock.isRunning) return;

    this.dataStore.gameClock.isRunning = true;
    this.dataStore.status = 'live';
    this.lastTick = Date.now();
    this.elapsedTime = 0;

    this.gameClockInterval = setInterval(() => {
      this.tick();
    }, this.tickRate);
  }

  // 暂停比赛时钟
  pauseGameClock() {
    this.dataStore.gameClock.isRunning = false;
    this.dataStore.status = 'paused';

    if (this.gameClockInterval) {
      clearInterval(this.gameClockInterval);
      this.gameClockInterval = null;
    }
  }

  // 停止比赛时钟
  stopGameClock() {
    this.pauseGameClock();
    this.dataStore.status = 'finished';
  }

  // 复位比赛时钟
  resetGameClock() {
    this.pauseGameClock();
    const sportType = this.dataStore.sportType;

    if (sportType === 'basketball') {
      this.dataStore.gameClock.currentTime = 600; // 10分钟
    } else if (sportType === 'football') {
      this.dataStore.gameClock.currentTime = 2700; // 45分钟
    }

    this.dataStore.gameClock.currentQuarter = 1;
    this.dataStore.gameClock.currentHalf = 1;
    this.elapsedTime = 0;
    this.dataStore.lastUpdate = Date.now();
  }

  // 单节/半场结束
  endQuarterOrHalf() {
    this.pauseGameClock();

    const sportType = this.dataStore.sportType;

    if (sportType === 'basketball') {
      // 篮球：进入下一节或比赛结束
      const currentQuarter = this.dataStore.gameClock.currentQuarter;
      const maxQuarters = 4;

      if (currentQuarter < maxQuarters) {
        // 进入下一节
        this.dataStore.gameClock.currentQuarter++;
        this.dataStore.gameClock.currentTime = 600; // 重置为10分钟

        // 记录节结束事件
        this.dataStore.addEvent('quarter_end', {
          quarter: currentQuarter,
          score: {
            home: this.dataStore.homeTeam.score,
            away: this.dataStore.awayTeam.score
          }
        });

        this.dataStore.lastUpdate = Date.now();
      } else {
        // 比赛结束
        this.dataStore.status = 'finished';
        this.dataStore.addEvent('match_end', {
          winner: this.determineWinner(),
          finalScore: {
            home: this.dataStore.homeTeam.score,
            away: this.dataStore.awayTeam.score
          }
        });
      }
    } else if (sportType === 'football') {
      // 足球：进入下半场或比赛结束
      const currentHalf = this.dataStore.gameClock.currentHalf;
      const maxHalves = 2;

      if (currentHalf < maxHalves) {
        // 进入下半场
        this.dataStore.gameClock.currentHalf++;
        this.dataStore.gameClock.currentTime = 2700; // 重置为45分钟

        // 记录半场结束事件
        this.dataStore.addEvent('half_time', {
          half: currentHalf,
          score: {
            home: this.dataStore.homeTeam.score,
            away: this.dataStore.awayTeam.score
          }
        });

        this.dataStore.lastUpdate = Date.now();
      } else {
        // 比赛结束
        this.dataStore.status = 'finished';
        this.dataStore.addEvent('match_end', {
          winner: this.determineWinner(),
          finalScore: {
            home: this.dataStore.homeTeam.score,
            away: this.dataStore.awayTeam.score
          }
        });
      }
    }
  }

  // 时钟tick（每10ms执行一次）
  tick() {
    const now = Date.now();
    const delta = now - this.lastTick;
    this.elapsedTime += delta;
    this.lastTick = now;

    const { currentTime, isCountDown, precision } = this.dataStore.gameClock;

    if (precision === 'millisecond') {
      // 毫秒级计时
      const secondsDelta = delta / 1000;

      if (isCountDown) {
        // 倒计时
        this.dataStore.gameClock.currentTime -= secondsDelta;

        // 检查是否到达0
        if (this.dataStore.gameClock.currentTime <= 0) {
          this.dataStore.gameClock.currentTime = 0;
          this.endQuarterOrHalf();
        }
      } else {
        // 正计时
        this.dataStore.gameClock.currentTime += secondsDelta;
      }
    } else {
      // 秒级计时
      if (this.elapsedTime >= 1000) {
        const secondsDelta = Math.floor(this.elapsedTime / 1000);

        if (isCountDown) {
          this.dataStore.gameClock.currentTime -= secondsDelta;

          if (this.dataStore.gameClock.currentTime <= 0) {
            this.dataStore.gameClock.currentTime = 0;
            this.endQuarterOrHalf();
          }
        } else {
          this.dataStore.gameClock.currentTime += secondsDelta;
        }

        this.elapsedTime = 0;
      }
    }

    // 同步更新进攻时钟
    if (this.dataStore.shotClock.isRunning) {
      this.updateShotClock(delta);
    }

    this.dataStore.lastUpdate = Date.now();
  }

  // 切换计时方向（倒计时/正计时）
  toggleCountDown() {
    this.dataStore.gameClock.isCountDown =
      !this.dataStore.gameClock.isCountDown;
    this.dataStore.lastUpdate = Date.now();
  }

  // 设置比赛时间（秒）
  setGameTime(seconds) {
    this.dataStore.gameClock.currentTime = seconds;
    this.dataStore.lastUpdate = Date.now();
  }

  // 添加时间（秒）
  addTime(seconds) {
    this.dataStore.gameClock.currentTime = Math.max(0,
      this.dataStore.gameClock.currentTime + seconds
    );
    this.dataStore.lastUpdate = Date.now();
  }

  // 设置伤停补时（足球）
  setInjuryTime(seconds) {
    if (this.dataStore.sportType === 'football') {
      // 在半场结束时自动加时
      this.dataStore.addEvent('injury_time', {
        seconds: seconds,
        half: this.dataStore.gameClock.currentHalf
      });
      this.dataStore.lastUpdate = Date.now();
    }
  }

  // === 进攻时钟控制（篮球）===

  // 开始进攻时钟
  startShotClock() {
    if (!this.dataStore.shotClock.enabled) return;

    this.dataStore.shotClock.isRunning = true;
    this.dataStore.shotClock.currentTime = this.dataStore.shotClock.maxTime;
    this.shotClockElapsedTime = 0;
  }

  // 暂停进攻时钟
  pauseShotClock() {
    this.dataStore.shotClock.isRunning = false;

    if (this.shotClockInterval) {
      clearInterval(this.shotClockInterval);
      this.shotClockInterval = null;
    }
  }

  // 更新进攻时钟（从比赛时钟tick中调用）
  updateShotClock(delta) {
    if (!this.dataStore.shotClock.isRunning) return;

    const precision = this.dataStore.gameClock.precision;
    this.shotClockElapsedTime += delta;

    if (precision === 'millisecond') {
      // 毫秒级计时
      this.dataStore.shotClock.currentTime -= delta / 1000;

      if (this.dataStore.shotClock.currentTime <= 0) {
        this.dataStore.shotClock.currentTime = 0;
        this.pauseShotClock();

        // 自动切换球权
        this.switchBallPossession();

        // 触发进攻时间违例事件
        this.dataStore.addEvent('shot_clock_violation', {
          team: this.dataStore.ballPossession || 'home'
        });
      }
    } else {
      // 秒级计时 - 只在累计超过1秒时才减1
      if (this.shotClockElapsedTime >= 1000) {
        this.dataStore.shotClock.currentTime--;
        this.shotClockElapsedTime = 0; // 重置累计时间

        if (this.dataStore.shotClock.currentTime <= 0) {
          this.dataStore.shotClock.currentTime = 0;
          this.pauseShotClock();

          // 自动切换球权
          this.switchBallPossession();

          this.dataStore.addEvent('shot_clock_violation', {
            team: this.dataStore.ballPossession || 'home'
          });
        }
      }
    }

    this.dataStore.lastUpdate = Date.now();
  }

  // 自动切换球权
  switchBallPossession() {
    const currentPossession = this.dataStore.ballPossession;

    // 如果有球权，切换到另一方
    if (currentPossession === 'home') {
      this.dataStore.ballPossession = 'away';
    } else if (currentPossession === 'away') {
      this.dataStore.ballPossession = 'home';
    } else {
      // 如果没有球权，默认为主队
      this.dataStore.ballPossession = 'home';
    }

    this.dataStore.addEvent('ball_possession_change', {
      from: currentPossession,
      to: this.dataStore.ballPossession,
      reason: 'shot_clock_violation'
    });
  }

  // 复位进攻时钟
  resetShotClock() {
    this.pauseShotClock();
    this.dataStore.shotClock.currentTime = this.dataStore.shotClock.maxTime;
    this.shotClockElapsedTime = 0;
    this.dataStore.lastUpdate = Date.now();
  }

  // 设置进攻时钟时间（秒）
  setShotClockTime(seconds) {
    this.pauseShotClock();
    this.dataStore.shotClock.currentTime = seconds;
    this.dataStore.lastUpdate = Date.now();
  }

  // 设置进攻时钟最大时间
  setShotClockMaxTime(seconds) {
    this.dataStore.shotClock.maxTime = seconds;
    this.dataStore.lastUpdate = Date.now();
  }

  // 启用/禁用进攻时钟
  toggleShotClockEnabled() {
    this.dataStore.shotClock.enabled =
      !this.dataStore.shotClock.enabled;
    this.dataStore.lastUpdate = Date.now();
  }

  // 辅助方法：判断比赛获胜者
  determineWinner() {
    const homeScore = this.dataStore.homeTeam.score;
    const awayScore = this.dataStore.awayTeam.score;

    if (homeScore > awayScore) {
      return { team: 'home', name: this.dataStore.homeTeam.name };
    } else if (awayScore > homeScore) {
      return { team: 'away', name: this.dataStore.awayTeam.name };
    } else {
      return { team: 'draw', name: '平局' };
    }
  }

  // 获取计时器状态
  getTimerStatus() {
    return {
      gameClock: {
        currentTime: this.dataStore.gameClock.currentTime,
        isCountDown: this.dataStore.gameClock.isCountDown,
        isRunning: this.dataStore.gameClock.isRunning,
        precision: this.dataStore.gameClock.precision,
        currentQuarter: this.dataStore.gameClock.currentQuarter,
        currentHalf: this.dataStore.gameClock.currentHalf,
        formattedTime: this.dataStore.formatGameTime()
      },
      shotClock: {
        currentTime: this.dataStore.shotClock.currentTime,
        isRunning: this.dataStore.shotClock.isRunning,
        maxTime: this.dataStore.shotClock.maxTime,
        enabled: this.dataStore.shotClock.enabled
      }
    };
  }
}

module.exports = TimerController;
