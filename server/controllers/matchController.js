/**
 * 比赛控制器
 * Match Controller - 按领域拆分的Controller
 */

const logger = require('../utils/logger');
const { asyncHandler } = require('../middleware/errorHandler');

class MatchController {
  constructor(dataStore) {
    this.dataStore = dataStore;
  }

  /**
   * 获取比赛信息
   */
  getMatchInfo(req, res) {
    const matchInfo = this.dataStore.getMatchInfo();

    logger.debug('Match info retrieved', {
      status: matchInfo.status,
      sport: matchInfo.sportType
    });

    res.json({
      success: true,
      data: matchInfo
    });
  }

  /**
   * 重置比赛
   */
  resetMatch(req, res) {
    this.dataStore.reset();

    logger.info('Match reset', {
      timestamp: new Date().toISOString(),
      user: req.user?.id
    });

    res.json({
      success: true,
      message: '比赛已重置'
    });
  }

  /**
   * 更新比赛状态
   */
  updateMatchStatus(req, res) {
    const { status } = req.body;

    const validStatuses = ['not_started', 'preparing', 'live', 'paused', 'finished'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          message: '无效的比赛状态',
          code: 'INVALID_STATUS'
        }
      });
    }

    this.dataStore.status = status;

    logger.info('Match status updated', {
      status,
      user: req.user?.id
    });

    res.json({
      success: true,
      message: '比赛状态已更新',
      data: { status }
    });
  }

  /**
   * 更新比赛类型
   */
  updateMatchSport(req, res) {
    const { sport } = req.body;

    const validSports = ['basketball', 'football'];
    if (!validSports.includes(sport)) {
      return res.status(400).json({
        success: false,
        error: {
          message: '无效的运动类型',
          code: 'INVALID_SPORT'
        }
      });
    }

    this.dataStore.sportType = sport;

    logger.info('Match sport updated', {
      sport,
      user: req.user?.id
    });

    res.json({
      success: true,
      message: '运动类型已更新',
      data: { sport }
    });
  }
}

module.exports = MatchController;
