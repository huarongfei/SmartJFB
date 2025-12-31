/**
 * 计时器逻辑测试
 * Timer Logic Tests with Jest
 */

const TimerControllerRefactored = require('../server/controllers/timerControllerRefactored');
const DataStore = require('../server/data-store');

describe('TimerController', () => {
  let timerController;
  let mockDataStore;

  beforeEach(() => {
    mockDataStore = {
      gameClock: {
        isRunning: false,
        currentTime: 600,
        currentQuarter: 1,
        isCountDown: true
      },
      shotClock: {
        isRunning: false,
        currentTime: 24,
        maxTime: 24
      },
      status: 'not_started',
      sport: 'basketball',
      rules: {
        QUARTER_TIME: 600,
        QUARTERS: 4
      },
      lastUpdate: Date.now()
    };

    timerController = new TimerControllerRefactored(mockDataStore);
  });

  describe('startGameClock', () => {
    test('应该成功启动时钟', () => {
      const result = timerController.startGameClock();

      expect(result.success).toBe(true);
      expect(mockDataStore.gameClock.isRunning).toBe(true);
      expect(mockDataStore.status).toBe('live');
    });

    test('时钟运行时不应该重复启动', () => {
      mockDataStore.gameClock.isRunning = true;

      const result = timerController.startGameClock();

      expect(result.success).toBe(false);
      expect(result.message).toBe('时钟已在运行中');
    });
  });

  describe('pauseGameClock', () => {
    test('应该成功暂停时钟', () => {
      mockDataStore.gameClock.isRunning = true;
      timerController.gameClockInterval = setInterval(() => {}, 100);

      const result = timerController.pauseGameClock();

      expect(result.success).toBe(true);
      expect(mockDataStore.gameClock.isRunning).toBe(false);
      expect(mockDataStore.status).toBe('paused');
    });

    test('时钟未运行时不应该暂停', () => {
      mockDataStore.gameClock.isRunning = false;

      const result = timerController.pauseGameClock();

      expect(result.success).toBe(false);
      expect(result.message).toBe('时钟未运行');
    });
  });

  describe('stopGameClock', () => {
    test('应该成功停止时钟', () => {
      mockDataStore.gameClock.isRunning = true;

      const result = timerController.stopGameClock();

      expect(result.success).toBe(true);
      expect(mockDataStore.gameClock.isRunning).toBe(false);
      expect(mockDataStore.status).toBe('finished');
    });
  });

  describe('resetGameClock', () => {
    test('应该成功重置时钟', () => {
      mockDataStore.gameClock.currentTime = 300;
      mockDataStore.gameClock.currentQuarter = 3;

      const result = timerController.resetGameClock();

      expect(result.success).toBe(true);
      expect(mockDataStore.gameClock.currentTime).toBe(600);
      expect(mockDataStore.gameClock.currentQuarter).toBe(1);
      expect(mockDataStore.status).toBe('not_started');
    });
  });

  describe('setGameTime', () => {
    test('应该成功设置时间', () => {
      const result = timerController.setGameTime(300);

      expect(result.success).toBe(true);
      expect(mockDataStore.gameClock.currentTime).toBe(300);
    });

    test('负数时间应该被拒绝', () => {
      const result = timerController.setGameTime(-10);

      expect(result.success).toBe(false);
      expect(mockDataStore.gameClock.currentTime).toBe(600);
    });

    test('非数字时间应该被拒绝', () => {
      const result = timerController.setGameTime('invalid');

      expect(result.success).toBe(false);
    });
  });

  describe('toggleCountDown', () => {
    test('应该成功切换倒计时方向', () => {
      mockDataStore.gameClock.isCountDown = true;

      const result = timerController.toggleCountDown();

      expect(result.success).toBe(true);
      expect(mockDataStore.gameClock.isCountDown).toBe(false);
    });
  });

  describe('endQuarter', () => {
    test('应该成功结束节次', () => {
      const result = timerController.endQuarter();

      expect(result.success).toBe(true);
      expect(mockDataStore.gameClock.currentQuarter).toBe(2);
    });

    test('超过最大节次时不应该增加', () => {
      mockDataStore.gameClock.currentQuarter = 4;

      const result = timerController.endQuarter();

      expect(result.success).toBe(false);
      expect(result.message).toBe('已达到最大节次');
      expect(mockDataStore.gameClock.currentQuarter).toBe(4);
    });
  });

  describe('getTimerStatus', () => {
    test('应该返回正确的计时器状态', () => {
      const status = timerController.getTimerStatus();

      expect(status).toHaveProperty('gameClock');
      expect(status).toHaveProperty('shotClock');
      expect(status).toHaveProperty('isRunning');
      expect(status).toHaveProperty('status');
      expect(status.isRunning).toBe(false);
      expect(status.status).toBe('not_started');
    });
  });
});
