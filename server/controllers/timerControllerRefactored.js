/**
 * 计时器控制器 (重构版)
 * Timer Controller (Refactored)
 */

const logger = require('../utils/logger');
const { asyncHandler } = require('../middleware/errorHandler');

class TimerControllerRefactored {
  constructor(dataStore) {
    this.dataStore = dataStore;
    this.gameClockInterval = null;
    this.shotClockInterval = null;
    this.tickRate = 10;
    this.lastTick = Date.now();
    this.elapsedTime = 0;
  }

  /**
   * 开始比赛时钟
   */
  startGameClock() {
    if (this.dataStore.gameClock.isRunning) {
      logger.debug('Game clock already running');
      return { success: false, message: '时钟已在运行中' };
    }

    this.dataStore.gameClock.isRunning = true;
    this.dataStore.status = 'live';
    this.lastTick = Date.now();
    this.elapsedTime = 0;

    this.gameClockInterval = setInterval(() => {
      this.tick();
    }, this.tickRate);

    logger.info('Game clock started');

    return { success: true, message: '比赛时钟已开始' };
  }

  /**
   * 暂停比赛时钟
   */
  pauseGameClock() {
    if (!this.dataStore.gameClock.isRunning) {
      return { success: false, message: '时钟未运行' };
    }

    this.dataStore.gameClock.isRunning = false;
    this.dataStore.status = 'paused';

    if (this.gameClockInterval) {
      clearInterval(this.gameClockInterval);
      this.gameClockInterval = null;
    }

    logger.info('Game clock paused');

    return { success: true, message: '比赛时钟已暂停' };
  }

  /**
   * 停止比赛时钟
   */
  stopGameClock() {
    const result = this.pauseGameClock();
    if (result.success) {
      this.dataStore.status = 'finished';
      logger.info('Game clock stopped');
    }
    return result;
  }

  /**
   * 复位比赛时钟
   */
  resetGameClock() {
    this.pauseGameClock();

    const quarterTime = this.dataStore.sport === 'basketball'
      ? this.dataStore.rules.QUARTER_TIME
      : this.dataStore.rules.HALF_TIME;

    this.dataStore.gameClock.currentTime = quarterTime;
    this.dataStore.gameClock.currentQuarter = 1;
    this.dataStore.status = 'not_started';

    logger.info('Game clock reset');

    return { success: true, message: '比赛时钟已复位' };
  }

  /**
   * 设置比赛时间
   */
  setGameTime(seconds) {
    if (typeof seconds !== 'number' || seconds < 0) {
      logger.warn('Invalid game time value', { seconds });
      return { success: false, message: '无效的时间值' };
    }

    this.dataStore.gameClock.currentTime = seconds;

    logger.info('Game time set', { seconds });

    return { success: true, message: '比赛时间已设置' };
  }

  /**
   * Tick 方法
   */
  tick() {
    const now = Date.now();
    const delta = now - this.lastTick;
    this.elapsedTime += delta;
    this.lastTick = now;

    if (this.dataStore.gameClock.isCountDown) {
      this.dataStore.gameClock.currentTime -= delta / 1000;
    } else {
      this.dataStore.gameClock.currentTime += delta / 1000;
    }

    // 防止时间变为负数
    if (this.dataStore.gameClock.currentTime < 0) {
      this.dataStore.gameClock.currentTime = 0;
      this.pauseGameClock();
    }

    this.dataStore.lastUpdate = Date.now();
  }

  /**
   * 获取计时器状态
   */
  getTimerStatus() {
    return {
      gameClock: this.dataStore.gameClock,
      shotClock: this.dataStore.shotClock,
      isRunning: this.dataStore.gameClock.isRunning,
      status: this.dataStore.status
    };
  }

  /**
   * 切换倒计时/正计时
   */
  toggleCountDown() {
    this.dataStore.gameClock.isCountDown = !this.dataStore.gameClock.isCountDown;

    logger.info('Countdown direction toggled', {
      isCountDown: this.dataStore.gameClock.isCountDown
    });

    return {
      success: true,
      message: '计时方向已切换',
      isCountDown: this.dataStore.gameClock.isCountDown
    };
  }

  /**
   * 结束节次/半场
   */
  endQuarter() {
    const maxPeriods = this.dataStore.sport === 'basketball'
      ? this.dataStore.rules.QUARTERS
      : this.dataStore.rules.HALVES;

    if (this.dataStore.gameClock.currentQuarter >= maxPeriods) {
      return { success: false, message: '已达到最大节次' };
    }

    this.dataStore.gameClock.currentQuarter++;

    const quarterTime = this.dataStore.sport === 'basketball'
      ? this.dataStore.rules.QUARTER_TIME
      : this.dataStore.rules.HALF_TIME;

    this.dataStore.gameClock.currentTime = quarterTime;

    logger.info('Quarter ended', {
      currentQuarter: this.dataStore.gameClock.currentQuarter
    });

    return { success: true, message: '节次已结束' };
  }
}

module.exports = TimerControllerRefactored;
