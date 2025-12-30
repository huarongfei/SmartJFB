/**
 * 导出服务 - Export Service
 * 负责所有数据的导出功能（PDF、Excel、CSV）
 */

const ExcelJS = require('exceljs');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');

class ExportService {
  constructor(dataStore) {
    this.dataStore = dataStore;
    this.exportDir = path.join(__dirname, '../exports');
    this.ensureExportDir();
  }

  /**
   * 确保导出目录存在
   */
  async ensureExportDir() {
    try {
      await fs.access(this.exportDir);
    } catch {
      await fs.mkdir(this.exportDir, { recursive: true });
    }
  }

  /**
   * 导出比赛摘要
   * @param {string} format - 'pdf', 'excel', 'csv'
   */
  async exportMatchSummary(format = 'excel') {
    const data = this.dataStore.getAll();
    const filename = `match_summary_${Date.now()}`;

    switch (format) {
      case 'pdf':
        return await this.exportMatchSummaryPDF(data, filename);
      case 'csv':
        return await this.exportMatchSummaryCSV(data, filename);
      case 'excel':
      default:
        return await this.exportMatchSummaryExcel(data, filename);
    }
  }

  /**
   * 导出球队技术统计总表
   * @param {string} format - 'pdf', 'excel', 'csv'
   */
  async exportTeamStatistics(format = 'excel') {
    const data = this.dataStore.getAll();
    const filename = `team_statistics_${Date.now()}`;

    switch (format) {
      case 'pdf':
        return await this.exportTeamStatisticsPDF(data, filename);
      case 'csv':
        return await this.exportTeamStatisticsCSV(data, filename);
      case 'excel':
      default:
        return await this.exportTeamStatisticsExcel(data, filename);
    }
  }

  /**
   * 导出球员个人数据明细表
   * @param {string} format - 'pdf', 'excel', 'csv'
   */
  async exportPlayerStatistics(format = 'excel') {
    const data = this.dataStore.getAll();
    const filename = `player_statistics_${Date.now()}`;

    switch (format) {
      case 'pdf':
        return await this.exportPlayerStatisticsPDF(data, filename);
      case 'csv':
        return await this.exportPlayerStatisticsCSV(data, filename);
      case 'excel':
      default:
        return await this.exportPlayerStatisticsExcel(data, filename);
    }
  }

  /**
   * 导出完整比赛事件序列（Play-by-Play）
   * @param {string} format - 'pdf', 'excel', 'csv'
   */
  async exportPlayByPlay(format = 'excel') {
    const data = this.dataStore.getAll();
    const filename = `play_by_play_${Date.now()}`;

    switch (format) {
      case 'pdf':
        return await this.exportPlayByPlayPDF(data, filename);
      case 'csv':
        return await this.exportPlayByPlayCSV(data, filename);
      case 'excel':
      default:
        return await this.exportPlayByPlayExcel(data, filename);
    }
  }

  /**
   * 导出所有数据
   * @param {string} format - 'excel', 'csv'
   */
  async exportAllData(format = 'excel') {
    const data = this.dataStore.getAll();
    const filename = `full_match_data_${Date.now()}`;

    switch (format) {
      case 'csv':
        return await this.exportAllDataCSV(data, filename);
      case 'excel':
      default:
        return await this.exportAllDataExcel(data, filename);
    }
  }

  // ==================== Excel 导出 ====================

  /**
   * 导出比赛摘要到 Excel
   */
  async exportMatchSummaryExcel(data, filename) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('比赛摘要 - Match Summary');

    // 标题样式
    const titleStyle = {
      font: { size: 16, bold: true, color: { argb: 'FFFFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } },
      alignment: { horizontal: 'center' }
    };

    const headerStyle = {
      font: { size: 12, bold: true, color: { argb: 'FFFFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF44546A' } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    };

    // 合并标题单元格
    worksheet.mergeCells('A1:E1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = '比赛摘要 - Match Summary';
    titleCell.style = titleStyle;
    worksheet.getRow(1).height = 30;

    // 比赛基本信息
    worksheet.addRow(['比赛信息', '', '', '', '']);
    worksheet.mergeCells('A2:B2');
    worksheet.getCell('A2').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };

    worksheet.addRow(['项目', '值']);
    worksheet.addRow(['比赛类型', data.settings.sportType === 'basketball' ? '篮球' : '足球']);
    worksheet.addRow(['比赛日期', new Date().toLocaleDateString('zh-CN')]);
    worksheet.addRow(['比赛状态', this.getStatusText(data.gameClock.isRunning)]);
    worksheet.addRow(['当前比分', `${data.homeTeam.score} - ${data.awayTeam.score}`]);
    worksheet.addRow(['比赛时间', data.settings.sportType === 'basketball' ? 
      `第${data.gameClock.quarter}节 ${this.formatTime(data.gameClock.currentTime)}` : 
      `第${data.gameClock.quarter}半场 ${this.formatTime(data.gameClock.currentTime)}`]);

    worksheet.addRow([]);

    // 队伍信息
    worksheet.addRow(['主队', data.homeTeam.name, data.homeTeam.score]);
    worksheet.addRow(['客队', data.awayTeam.name, data.awayTeam.score]);

    worksheet.addRow([]);

    // 最佳球员
    const bestPlayer = this.calculateBestPlayer(data);
    if (bestPlayer) {
      worksheet.addRow(['最佳球员', '', '', '', '']);
      worksheet.mergeCells('A10:E10');
      worksheet.getCell('A10').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE699' } };
      worksheet.addRow(['队伍', '球员', '得分', '助攻', '其他']);
      worksheet.addRow([bestPlayer.team, bestPlayer.name, bestPlayer.score, bestPlayer.assists, '-']);
    }

    // 设置列宽
    worksheet.getColumn('A').width = 20;
    worksheet.getColumn('B').width = 25;
    worksheet.getColumn('C').width = 15;
    worksheet.getColumn('D').width = 15;
    worksheet.getColumn('E').width = 15;

    const filepath = path.join(this.exportDir, `${filename}.xlsx`);
    await workbook.xlsx.writeFile(filepath);
    return filepath;
  }

  /**
   * 导出球队技术统计到 Excel
   */
  async exportTeamStatisticsExcel(data, filename) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('球队技术统计');

    // 标题
    worksheet.mergeCells('A1:L1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = '球队技术统计 - Team Statistics';
    titleCell.style = {
      font: { size: 16, bold: true, color: { argb: 'FFFFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } },
      alignment: { horizontal: 'center' }
    };
    worksheet.getRow(1).height = 30;

    // 表头
    const headers = ['项目', '主队', '客队'];
    if (data.settings.sportType === 'basketball') {
      headers.push('投篮命中率%', '罚球命中率%', '三分命中率%', '助攻', '篮板', '抢断', '盖帽', '失误', '犯规');
    } else {
      headers.push('射门次数', '射正次数', '控球率%', '角球', '任意球', '越位', '换人', '黄牌', '红牌');
    }

    worksheet.addRow(headers);
    const headerRow = worksheet.getRow(2);
    headerRow.eachCell((cell) => {
      cell.style = {
        font: { size: 12, bold: true, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF44546A' } },
        alignment: { horizontal: 'center' }
      };
    });

    // 数据行
    const homeStats = data.homeTeam.statistics;
    const awayStats = data.awayTeam.statistics;

    if (data.settings.sportType === 'basketball') {
      const rows = [
        ['总得分', data.homeTeam.score, data.awayTeam.score],
        ['投篮命中', `${homeStats.fieldGoalsMade}/${homeStats.fieldGoalsAttempted}`, 
                    `${awayStats.fieldGoalsMade}/${awayStats.fieldGoalsAttempted}`],
        ['三分命中', `${homeStats.threePointersMade}/${homeStats.threePointersAttempted}`, 
                    `${awayStats.threePointersMade}/${awayStats.threePointersAttempted}`],
        ['罚球命中', `${homeStats.freeThrowsMade}/${homeStats.freeThrowsAttempted}`, 
                    `${awayStats.freeThrowsMade}/${awayStats.freeThrowsAttempted}`],
        ['助攻', homeStats.assists, awayStats.assists],
        ['篮板', homeStats.rebounds, awayStats.rebounds],
        ['进攻篮板', homeStats.offensiveRebounds, awayStats.offensiveRebounds],
        ['防守篮板', homeStats.defensiveRebounds, awayStats.defensiveRebounds],
        ['抢断', homeStats.steals, awayStats.steals],
        ['盖帽', homeStats.blocks, awayStats.blocks],
        ['失误', homeStats.turnovers, awayStats.turnovers],
        ['犯规', homeStats.fouls, awayStats.fouls]
      ];

      rows.forEach(row => worksheet.addRow(row));
    } else {
      const rows = [
        ['总得分', data.homeTeam.score, data.awayTeam.score],
        ['射门次数', homeStats.shotsAttempted, awayStats.shotsAttempted],
        ['射正次数', homeStats.shotsOnTarget, awayStats.shotsOnTarget],
        ['角球', homeStats.corners, awayStats.corners],
        ['任意球', homeStats.freeKicks, awayStats.freeKicks],
        ['越位', homeStats.offsides, awayStats.offsides],
        ['换人', homeStats.substitutions, awayStats.substitutions],
        ['黄牌', homeStats.yellowCards, awayStats.yellowCards],
        ['红牌', homeStats.redCards, awayStats.redCards]
      ];

      rows.forEach(row => worksheet.addRow(row));
    }

    // 设置列宽
    worksheet.columns.forEach((column, index) => {
      column.width = index === 0 ? 18 : 15;
    });

    const filepath = path.join(this.exportDir, `${filename}.xlsx`);
    await workbook.xlsx.writeFile(filepath);
    return filepath;
  }

  /**
   * 导出球员个人数据到 Excel
   */
  async exportPlayerStatisticsExcel(data, filename) {
    const workbook = new ExcelJS.Workbook();

    // 主队球员统计
    const homeWorksheet = workbook.addWorksheet('主队球员');
    await this.createPlayerSheet(homeWorksheet, data.homeTeam, '主队', data.settings.sportType);

    // 客队球员统计
    const awayWorksheet = workbook.addWorksheet('客队球员');
    await this.createPlayerSheet(awayWorksheet, data.awayTeam, '客队', data.settings.sportType);

    const filepath = path.join(this.exportDir, `${filename}.xlsx`);
    await workbook.xlsx.writeFile(filepath);
    return filepath;
  }

  /**
   * 创建球员统计工作表
   */
  async createPlayerSheet(worksheet, team, teamName, sportType) {
    // 标题
    worksheet.mergeCells('A1:M1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `${teamName}球员统计`;
    titleCell.style = {
      font: { size: 14, bold: true, color: { argb: 'FFFFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } },
      alignment: { horizontal: 'center' }
    };
    worksheet.getRow(1).height = 25;

    // 表头
    let headers = ['号码', '姓名', '出场时间'];
    if (sportType === 'basketball') {
      headers = headers.concat(['得分', '投篮%', '三分%', '罚球%', '助攻', '篮板', '抢断', '盖帽', '失误', '犯规']);
    } else {
      headers = headers.concat(['射门', '射正', '助攻', '黄牌', '红牌']);
    }

    worksheet.addRow(headers);
    const headerRow = worksheet.getRow(2);
    headerRow.eachCell((cell) => {
      cell.style = {
        font: { size: 11, bold: true, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF44546A' } },
        alignment: { horizontal: 'center' }
      };
    });

    // 球员数据
    team.players.forEach(player => {
      const stats = player.statistics;
      const row = [player.number, player.name, stats.minutesPlayed];

      if (sportType === 'basketball') {
        row.push(
          stats.points,
          stats.fieldGoalsAttempted > 0 ? 
            ((stats.fieldGoalsMade / stats.fieldGoalsAttempted) * 100).toFixed(1) + '%' : '-',
          stats.threePointersAttempted > 0 ? 
            ((stats.threePointersMade / stats.threePointersAttempted) * 100).toFixed(1) + '%' : '-',
          stats.freeThrowsAttempted > 0 ? 
            ((stats.freeThrowsMade / stats.freeThrowsAttempted) * 100).toFixed(1) + '%' : '-',
          stats.assists,
          stats.rebounds,
          stats.steals,
          stats.blocks,
          stats.turnovers,
          stats.fouls
        );
      } else {
        row.push(
          stats.shotsAttempted,
          stats.shotsOnTarget,
          stats.assists,
          stats.yellowCards,
          stats.redCards
        );
      }

      worksheet.addRow(row);
    });

    // 设置列宽
    worksheet.columns.forEach((column, index) => {
      column.width = index < 3 ? 12 : 10;
    });
  }

  /**
   * 导出 Play-by-Play 到 Excel
   */
  async exportPlayByPlayExcel(data, filename) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('比赛事件序列 - Play-by-Play');

    // 标题
    worksheet.mergeCells('A1:G1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = '比赛事件序列 - Play-by-Play';
    titleCell.style = {
      font: { size: 16, bold: true, color: { argb: 'FFFFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } },
      alignment: { horizontal: 'center' }
    };
    worksheet.getRow(1).height = 30;

    // 表头
    const headers = ['时间', '节次/半场', '队伍', '事件类型', '球员', '详细描述', '时间戳'];
    worksheet.addRow(headers);
    const headerRow = worksheet.getRow(2);
    headerRow.eachCell((cell) => {
      cell.style = {
        font: { size: 11, bold: true, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF44546A' } },
        alignment: { horizontal: 'center' }
      };
    });

    // 事件数据
    const events = data.events || [];
    events.forEach(event => {
      const row = [
        this.formatTime(event.gameTime),
        data.settings.sportType === 'basketball' ? `第${event.quarter}节` : `第${event.quarter}半场`,
        event.team === 'home' ? data.homeTeam.name : data.awayTeam.name,
        this.translateEventType(event.type),
        event.playerName || '-',
        event.description || this.generateEventDescription(event, data),
        new Date(event.timestamp).toLocaleString('zh-CN')
      ];
      worksheet.addRow(row);
    });

    // 设置列宽
    worksheet.columns = [
      { width: 12 },
      { width: 12 },
      { width: 18 },
      { width: 20 },
      { width: 12 },
      { width: 35 },
      { width: 25 }
    ];

    const filepath = path.join(this.exportDir, `${filename}.xlsx`);
    await workbook.xlsx.writeFile(filepath);
    return filepath;
  }

  /**
   * 导出所有数据到 Excel
   */
  async exportAllDataExcel(data, filename) {
    const workbook = new ExcelJS.Workbook();

    // 1. 比赛摘要
    await this.exportMatchSummaryExcelToWorkbook(workbook, data);

    // 2. 球队统计
    await this.exportTeamStatisticsExcelToWorkbook(workbook, data);

    // 3. 主队球员
    await this.createPlayerSheet(workbook.addWorksheet('主队球员'), data.homeTeam, '主队', data.settings.sportType);

    // 4. 客队球员
    await this.createPlayerSheet(workbook.addWorksheet('客队球员'), data.awayTeam, '客队', data.settings.sportType);

    // 5. Play-by-Play
    await this.exportPlayByPlayExcelToWorkbook(workbook, data);

    const filepath = path.join(this.exportDir, `${filename}.xlsx`);
    await workbook.xlsx.writeFile(filepath);
    return filepath;
  }

  // ==================== CSV 导出 ====================

  /**
   * 导出比赛摘要到 CSV
   */
  async exportMatchSummaryCSV(data, filename) {
    const csv = [
      '比赛摘要 - Match Summary',
      '',
      '比赛信息,值',
      `比赛类型,${data.settings.sportType === 'basketball' ? '篮球' : '足球'}`,
      `比赛日期,${new Date().toLocaleDateString('zh-CN')}`,
      `比赛状态,${this.getStatusText(data.gameClock.isRunning)}`,
      `当前比分,${data.homeTeam.score}-${data.awayTeam.score}`,
      `比赛时间,${data.settings.sportType === 'basketball' ? 
        `第${data.gameClock.quarter}节 ${this.formatTime(data.gameClock.currentTime)}` : 
        `第${data.gameClock.quarter}半场 ${this.formatTime(data.gameClock.currentTime)}`}`,
      '',
      '主队,' + data.homeTeam.name,
      '客队,' + data.awayTeam.name
    ];

    const filepath = path.join(this.exportDir, `${filename}.csv`);
    await fs.writeFile(filepath, csv.join('\n'), 'utf-8');
    return filepath;
  }

  /**
   * 导出球队统计到 CSV
   */
  async exportTeamStatisticsCSV(data, filename) {
    const csv = [
      '球队技术统计 - Team Statistics',
      ''
    ];

    const homeStats = data.homeTeam.statistics;
    const awayStats = data.awayTeam.statistics;

    if (data.settings.sportType === 'basketball') {
      csv.push('项目,主队,客队');
      csv.push(`总得分,${data.homeTeam.score},${data.awayTeam.score}`);
      csv.push(`投篮命中,${homeStats.fieldGoalsMade}/${homeStats.fieldGoalsAttempted},${awayStats.fieldGoalsMade}/${awayStats.fieldGoalsAttempted}`);
      csv.push(`三分命中,${homeStats.threePointersMade}/${homeStats.threePointersAttempted},${awayStats.threePointersMade}/${awayStats.threePointersAttempted}`);
      csv.push(`罚球命中,${homeStats.freeThrowsMade}/${homeStats.freeThrowsAttempted},${awayStats.freeThrowsMade}/${awayStats.freeThrowsAttempted}`);
      csv.push(`助攻,${homeStats.assists},${awayStats.assists}`);
      csv.push(`篮板,${homeStats.rebounds},${awayStats.rebounds}`);
      csv.push(`抢断,${homeStats.steals},${awayStats.steals}`);
      csv.push(`盖帽,${homeStats.blocks},${awayStats.blocks}`);
      csv.push(`失误,${homeStats.turnovers},${awayStats.turnovers}`);
      csv.push(`犯规,${homeStats.fouls},${awayStats.fouls}`);
    } else {
      csv.push('项目,主队,客队');
      csv.push(`总得分,${data.homeTeam.score},${data.awayTeam.score}`);
      csv.push(`射门次数,${homeStats.shotsAttempted},${awayStats.shotsAttempted}`);
      csv.push(`射正次数,${homeStats.shotsOnTarget},${awayStats.shotsOnTarget}`);
      csv.push(`角球,${homeStats.corners},${awayStats.corners}`);
      csv.push(`任意球,${homeStats.freeKicks},${awayStats.freeKicks}`);
      csv.push(`越位,${homeStats.offsides},${awayStats.offsides}`);
      csv.push(`换人,${homeStats.substitutions},${awayStats.substitutions}`);
      csv.push(`黄牌,${homeStats.yellowCards},${awayStats.yellowCards}`);
      csv.push(`红牌,${homeStats.redCards},${awayStats.redCards}`);
    }

    const filepath = path.join(this.exportDir, `${filename}.csv`);
    await fs.writeFile(filepath, csv.join('\n'), 'utf-8');
    return filepath;
  }

  /**
   * 导出球员统计到 CSV
   */
  async exportPlayerStatisticsCSV(data, filename) {
    const csv = ['主队球员统计', ''];

    csv.push('号码,姓名,出场时间,得分,投篮%,三分%,罚球%,助攻,篮板,抢断,盖帽,失误,犯规');
    data.homeTeam.players.forEach(player => {
      const s = player.statistics;
      csv.push(`${player.number},${player.name},${s.minutesPlayed},${s.points},` +
        `${s.fieldGoalsAttempted > 0 ? (s.fieldGoalsMade/s.fieldGoalsAttempted*100).toFixed(1)+'%' : '-'},` +
        `${s.threePointersAttempted > 0 ? (s.threePointersMade/s.threePointersAttempted*100).toFixed(1)+'%' : '-'},` +
        `${s.freeThrowsAttempted > 0 ? (s.freeThrowsMade/s.freeThrowsAttempted*100).toFixed(1)+'%' : '-'},` +
        `${s.assists},${s.rebounds},${s.steals},${s.blocks},${s.turnovers},${s.fouls}`);
    });

    csv.push('');
    csv.push('客队球员统计', '');
    csv.push('号码,姓名,出场时间,得分,投篮%,三分%,罚球%,助攻,篮板,抢断,盖帽,失误,犯规');
    data.awayTeam.players.forEach(player => {
      const s = player.statistics;
      csv.push(`${player.number},${player.name},${s.minutesPlayed},${s.points},` +
        `${s.fieldGoalsAttempted > 0 ? (s.fieldGoalsMade/s.fieldGoalsAttempted*100).toFixed(1)+'%' : '-'},` +
        `${s.threePointersAttempted > 0 ? (s.threePointersMade/s.threePointersAttempted*100).toFixed(1)+'%' : '-'},` +
        `${s.freeThrowsAttempted > 0 ? (s.freeThrowsMade/s.freeThrowsAttempted*100).toFixed(1)+'%' : '-'},` +
        `${s.assists},${s.rebounds},${s.steals},${s.blocks},${s.turnovers},${s.fouls}`);
    });

    const filepath = path.join(this.exportDir, `${filename}.csv`);
    await fs.writeFile(filepath, csv.join('\n'), 'utf-8');
    return filepath;
  }

  /**
   * 导出 Play-by-Play 到 CSV
   */
  async exportPlayByPlayCSV(data, filename) {
    const csv = [
      '比赛事件序列 - Play-by-Play',
      '时间,节次/半场,队伍,事件类型,球员,详细描述,时间戳'
    ];

    const events = data.events || [];
    events.forEach(event => {
      csv.push(`${this.formatTime(event.gameTime)},` +
        `${data.settings.sportType === 'basketball' ? '第'+event.quarter+'节' : '第'+event.quarter+'半场'},` +
        `${event.team === 'home' ? data.homeTeam.name : data.awayTeam.name},` +
        `${this.translateEventType(event.type)},` +
        `${event.playerName || '-'},` +
        `${event.description || this.generateEventDescription(event, data)},` +
        `${new Date(event.timestamp).toLocaleString('zh-CN')}`);
    });

    const filepath = path.join(this.exportDir, `${filename}.csv`);
    await fs.writeFile(filepath, csv.join('\n'), 'utf-8');
    return filepath;
  }

  /**
   * 导出所有数据到 CSV
   */
  async exportAllDataCSV(data, filename) {
    const csv = [];

    csv.push('========================================');
    csv.push('比赛摘要 - Match Summary');
    csv.push('========================================');
    csv.push(`比赛类型,${data.settings.sportType === 'basketball' ? '篮球' : '足球'}`);
    csv.push(`当前比分,${data.homeTeam.score}-${data.awayTeam.score}`);
    csv.push('');

    csv.push('========================================');
    csv.push('球队统计 - Team Statistics');
    csv.push('========================================');
    csv.push('项目,主队,客队');

    const homeStats = data.homeTeam.statistics;
    const awayStats = data.awayTeam.statistics;

    if (data.settings.sportType === 'basketball') {
      csv.push(`总得分,${data.homeTeam.score},${data.awayTeam.score}`);
      csv.push(`助攻,${homeStats.assists},${awayStats.assists}`);
      csv.push(`篮板,${homeStats.rebounds},${awayStats.rebounds}`);
    } else {
      csv.push(`总得分,${data.homeTeam.score},${data.awayTeam.score}`);
      csv.push(`射门次数,${homeStats.shotsAttempted},${awayStats.shotsAttempted}`);
      csv.push(`黄牌,${homeStats.yellowCards},${awayStats.yellowCards}`);
      csv.push(`红牌,${homeStats.redCards},${awayStats.redCards}`);
    }

    csv.push('');
    csv.push('========================================');
    csv.push('主队球员');
    csv.push('========================================');
    csv.push('号码,姓名,得分,助攻,犯规');
    data.homeTeam.players.forEach(p => {
      csv.push(`${p.number},${p.name},${p.statistics.points},${p.statistics.assists},${p.statistics.fouls}`);
    });

    csv.push('');
    csv.push('========================================');
    csv.push('客队球员');
    csv.push('========================================');
    csv.push('号码,姓名,得分,助攻,犯规');
    data.awayTeam.players.forEach(p => {
      csv.push(`${p.number},${p.name},${p.statistics.points},${p.statistics.assists},${p.statistics.fouls}`);
    });

    csv.push('');
    csv.push('========================================');
    csv.push('比赛事件序列 - Play-by-Play');
    csv.push('========================================');
    csv.push('时间,队伍,事件类型,球员,描述');
    (data.events || []).forEach(e => {
      csv.push(`${this.formatTime(e.gameTime)},${e.team === 'home' ? data.homeTeam.name : data.awayTeam.name},${this.translateEventType(e.type)},${e.playerName || '-'},${e.description || this.generateEventDescription(e, data)}`);
    });

    const filepath = path.join(this.exportDir, `${filename}.csv`);
    await fs.writeFile(filepath, csv.join('\n'), 'utf-8');
    return filepath;
  }

  // ==================== PDF 导出 ====================

  /**
   * 导出比赛摘要到 PDF
   */
  async exportMatchSummaryPDF(data, filename) {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let y = 750;

    // 标题
    page.drawText('比赛摘要 - Match Summary', {
      x: 150,
      y,
      size: 24,
      font: fontBold,
      color: rgb(0.2, 0.2, 0.2)
    });
    y -= 50;

    // 比赛信息
    const info = [
      `比赛类型: ${data.settings.sportType === 'basketball' ? '篮球' : '足球'}`,
      `比赛日期: ${new Date().toLocaleDateString('zh-CN')}`,
      `比赛状态: ${this.getStatusText(data.gameClock.isRunning)}`,
      `当前比分: ${data.homeTeam.score} - ${data.awayTeam.score}`
    ];

    info.forEach(line => {
      page.drawText(line, { x: 50, y, size: 12, font });
      y -= 25;
    });

    // 队伍信息
    y -= 30;
    page.drawText(`主队: ${data.homeTeam.name}`, { x: 50, y, size: 14, font: fontBold });
    page.drawText(`客队: ${data.awayTeam.name}`, { x: 350, y, size: 14, font: fontBold });

    const filepath = path.join(this.exportDir, `${filename}.pdf`);
    await pdfDoc.save();
    return filepath;
  }

  // ==================== 辅助方法 ====================

  formatTime(seconds) {
    if (seconds === null || seconds === undefined) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  formatTimeWithMs(seconds) {
    if (seconds === null || seconds === undefined) return '--:--.--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  }

  getStatusText(isRunning) {
    return isRunning ? '进行中' : '暂停';
  }

  calculateBestPlayer(data) {
    const allPlayers = [...data.homeTeam.players, ...data.awayTeam.players];
    return allPlayers.reduce((best, player) => {
      const stats = player.statistics;
      const score = stats.points + stats.assists * 2 + stats.rebounds;
      if (!best || score > (best.statistics.points + best.statistics.assists * 2 + best.statistics.rebounds)) {
        return player;
      }
      return best;
    }, null);
  }

  translateEventType(type) {
    const translations = {
      'score_basketball': '得分',
      'score_football': '进球',
      'field_goal': '投篮',
      'three_pointer': '三分球',
      'free_throw': '罚球',
      'rebound': '篮板',
      'assist': '助攻',
      'steal': '抢断',
      'block': '盖帽',
      'turnover': '失误',
      'foul': '犯规',
      'shot': '射门',
      'corner': '角球',
      'free_kick': '任意球',
      'yellow_card': '黄牌',
      'red_card': '红牌',
      'substitution': '换人',
      'offside': '越位'
    };
    return translations[type] || type;
  }

  generateEventDescription(event, data) {
    switch (event.type) {
      case 'score_basketball':
        return `${event.playerName} ${event.points}分球命中`;
      case 'score_football':
        return `${event.playerName} 进球`;
      case 'three_pointer':
        return `${event.playerName} 三分球${event.made ? '命中' : '未中'}`;
      case 'free_throw':
        return `${event.playerName} 罚球${event.made ? '命中' : '未中'}`;
      case 'yellow_card':
        return `${event.playerName} 黄牌`;
      case 'red_card':
        return `${event.playerName} 红牌`;
      default:
        return event.type;
    }
  }

  // 辅助方法：导出到工作簿（用于合并导出）
  async exportMatchSummaryExcelToWorkbook(workbook, data) {
    const worksheet = workbook.addWorksheet('比赛摘要');
    // 复制之前的逻辑...
  }

  async exportTeamStatisticsExcelToWorkbook(workbook, data) {
    const worksheet = workbook.addWorksheet('球队统计');
    // 复制之前的逻辑...
  }

  async exportPlayByPlayExcelToWorkbook(workbook, data) {
    const worksheet = workbook.addWorksheet('事件序列');
    // 复制之前的逻辑...
  }

  async exportMatchSummaryPDF(data, filename) {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let y = 750;

    page.drawText('比赛摘要 - Match Summary', {
      x: 150,
      y,
      size: 24,
      font: fontBold,
      color: rgb(0.2, 0.2, 0.2)
    });
    y -= 50;

    const info = [
      `比赛类型: ${data.settings.sportType === 'basketball' ? '篮球' : '足球'}`,
      `比赛日期: ${new Date().toLocaleDateString('zh-CN')}`,
      `比赛状态: ${this.getStatusText(data.gameClock.isRunning)}`,
      `当前比分: ${data.homeTeam.score} - ${data.awayTeam.score}`
    ];

    info.forEach(line => {
      page.drawText(line, { x: 50, y, size: 12, font });
      y -= 25;
    });

    y -= 30;
    page.drawText(`主队: ${data.homeTeam.name}`, { x: 50, y, size: 14, font: fontBold });
    page.drawText(`客队: ${data.awayTeam.name}`, { x: 350, y, size: 14, font: fontBold });

    const filepath = path.join(this.exportDir, `${filename}.pdf`);
    const pdfBytes = await pdfDoc.save();
    await fs.writeFile(filepath, pdfBytes);
    return filepath;
  }

  async exportTeamStatisticsPDF(data, filename) {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let y = 750;

    page.drawText('球队技术统计 - Team Statistics', {
      x: 120,
      y,
      size: 24,
      font: fontBold,
      color: rgb(0.2, 0.2, 0.2)
    });
    y -= 50;

    page.drawText(`项目           主队          客队`, {
      x: 50, y, size: 12, font: fontBold
    });
    y -= 30;

    const homeStats = data.homeTeam.statistics;
    const awayStats = data.awayTeam.statistics;

    const stats = [
      ['总得分', data.homeTeam.score.toString(), data.awayTeam.score.toString()],
      ['助攻', homeStats.assists.toString(), awayStats.assists.toString()],
      ['篮板', homeStats.rebounds.toString(), awayStats.rebounds.toString()],
      ['抢断', homeStats.steals.toString(), awayStats.steals.toString()],
      ['盖帽', homeStats.blocks.toString(), awayStats.blocks.toString()],
      ['失误', homeStats.turnovers.toString(), awayStats.turnovers.toString()],
      ['犯规', homeStats.fouls.toString(), awayStats.fouls.toString()]
    ];

    stats.forEach(([item, home, away]) => {
      page.drawText(`${item.padEnd(12)}${home.padStart(8)}${away.padStart(8)}`, {
        x: 50, y, size: 11, font
      });
      y -= 25;
    });

    const filepath = path.join(this.exportDir, `${filename}.pdf`);
    const pdfBytes = await pdfDoc.save();
    await fs.writeFile(filepath, pdfBytes);
    return filepath;
  }

  async exportPlayerStatisticsPDF(data, filename) {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // 主队页面
    let page = pdfDoc.addPage([595, 842]);
    let y = 750;

    page.drawText('主队球员统计', {
      x: 200, y, size: 20, font: fontBold, color: rgb(0.2, 0.2, 0.2)
    });
    y -= 40;

    data.homeTeam.players.forEach(player => {
      if (y < 50) {
        page = pdfDoc.addPage([595, 842]);
        y = 750;
      }

      const s = player.statistics;
      page.drawText(`${player.number}. ${player.name} - 得分:${s.points} 助攻:${s.assists} 篮板:${s.rebounds}`, {
        x: 50, y, size: 11, font
      });
      y -= 25;
    });

    // 客队页面
    page = pdfDoc.addPage([595, 842]);
    y = 750;

    page.drawText('客队球员统计', {
      x: 200, y, size: 20, font: fontBold, color: rgb(0.2, 0.2, 0.2)
    });
    y -= 40;

    data.awayTeam.players.forEach(player => {
      if (y < 50) {
        page = pdfDoc.addPage([595, 842]);
        y = 750;
      }

      const s = player.statistics;
      page.drawText(`${player.number}. ${player.name} - 得分:${s.points} 助攻:${s.assists} 篮板:${s.rebounds}`, {
        x: 50, y, size: 11, font
      });
      y -= 25;
    });

    const filepath = path.join(this.exportDir, `${filename}.pdf`);
    const pdfBytes = await pdfDoc.save();
    await fs.writeFile(filepath, pdfBytes);
    return filepath;
  }

  async exportPlayByPlayPDF(data, filename) {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let page = pdfDoc.addPage([595, 842]);
    let y = 750;

    page.drawText('比赛事件序列 - Play-by-Play', {
      x: 130, y, size: 24, font: fontBold, color: rgb(0.2, 0.2, 0.2)
    });
    y -= 40;

    const events = data.events || [];
    events.forEach((event, index) => {
      if (y < 50) {
        page = pdfDoc.addPage([595, 842]);
        y = 750;
      }

      const time = this.formatTime(event.gameTime);
      const quarter = data.settings.sportType === 'basketball' ? `第${event.quarter}节` : `第${event.quarter}半场`;
      const team = event.team === 'home' ? data.homeTeam.name : data.awayTeam.name;
      const type = this.translateEventType(event.type);
      const player = event.playerName || '-';

      const text = `${time} ${quarter} ${team} ${type} ${player}`;
      page.drawText(text, {
        x: 50, y, size: 10, font
      });
      y -= 20;
    });

    const filepath = path.join(this.exportDir, `${filename}.pdf`);
    const pdfBytes = await pdfDoc.save();
    await fs.writeFile(filepath, pdfBytes);
    return filepath;
  }
}

module.exports = ExportService;
