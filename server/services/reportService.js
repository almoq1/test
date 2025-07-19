const { Report, User, Company, Booking, Flight, Wallet, WalletTransaction } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class ReportService {
  constructor() {
    this.reportTemplates = this.loadReportTemplates();
    this.outputDir = path.join(__dirname, '../reports');
    this.ensureOutputDirectory();
  }

  // Generate custom report
  async generateCustomReport(reportType, parameters, companyId, format = 'json') {
    try {
      const reportData = await this.getReportData(reportType, parameters, companyId);
      const report = await this.createReportRecord(reportType, parameters, companyId, format);
      
      if (format === 'json') {
        return { report, data: reportData };
      } else {
        const filePath = await this.generateFile(reportType, reportData, format, report.id);
        await report.update({ 
          filePath, 
          status: 'completed',
          data: reportData,
          processingTime: Date.now() - report.createdAt.getTime()
        });
        return { report, filePath };
      }
    } catch (error) {
      console.error('Report generation error:', error);
      throw error;
    }
  }

  // Get report data based on type
  async getReportData(reportType, parameters, companyId) {
    switch (reportType) {
      case 'booking_summary':
        return await this.getBookingSummaryReport(parameters, companyId);
      case 'revenue_analysis':
        return await this.getRevenueAnalysisReport(parameters, companyId);
      case 'customer_behavior':
        return await this.getCustomerBehaviorReport(parameters, companyId);
      case 'financial_performance':
        return await this.getFinancialPerformanceReport(parameters, companyId);
      case 'operational_metrics':
        return await this.getOperationalMetricsReport(parameters, companyId);
      case 'flight_performance':
        return await this.getFlightPerformanceReport(parameters, companyId);
      case 'wallet_analysis':
        return await this.getWalletAnalysisReport(parameters, companyId);
      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }
  }

  // Booking summary report
  async getBookingSummaryReport(parameters, companyId) {
    const { startDate, endDate, groupBy = 'day' } = parameters;
    const whereClause = companyId ? { companyId } : {};

    const bookings = await Booking.findAll({
      where: {
        ...whereClause,
        createdAt: { [Op.between]: [startDate, endDate] }
      },
      include: [
        { model: User, as: 'user' },
        { model: Flight, as: 'flight' }
      ],
      order: [['createdAt', 'ASC']]
    });

    const summary = this.groupBookingsByDate(bookings, groupBy);
    
    return {
      reportType: 'booking_summary',
      parameters,
      summary,
      totalBookings: bookings.length,
      totalRevenue: bookings.reduce((sum, b) => sum + b.totalAmount, 0),
      averageBookingValue: bookings.length > 0 ? 
        bookings.reduce((sum, b) => sum + b.totalAmount, 0) / bookings.length : 0
    };
  }

  // Revenue analysis report
  async getRevenueAnalysisReport(parameters, companyId) {
    const { startDate, endDate, breakdown = 'monthly' } = parameters;
    const whereClause = companyId ? { companyId } : {};

    const bookings = await Booking.findAll({
      where: {
        ...whereClause,
        createdAt: { [Op.between]: [startDate, endDate] },
        status: 'confirmed'
      },
      include: [
        { model: Flight, as: 'flight' }
      ]
    });

    const revenueBreakdown = this.breakdownRevenue(bookings, breakdown);
    
    return {
      reportType: 'revenue_analysis',
      parameters,
      revenueBreakdown,
      totalRevenue: bookings.reduce((sum, b) => sum + b.totalAmount, 0),
      revenueGrowth: this.calculateRevenueGrowth(bookings, breakdown)
    };
  }

  // Customer behavior report
  async getCustomerBehaviorReport(parameters, companyId) {
    const { startDate, endDate } = parameters;
    const whereClause = companyId ? { companyId } : {};

    const users = await User.findAll({
      where: whereClause,
      include: [
        {
          model: Booking,
          as: 'bookings',
          where: {
            createdAt: { [Op.between]: [startDate, endDate] }
          },
          include: [{ model: Flight, as: 'flight' }]
        }
      ]
    });

    const behaviorAnalysis = this.analyzeCustomerBehavior(users);
    
    return {
      reportType: 'customer_behavior',
      parameters,
      behaviorAnalysis,
      totalCustomers: users.length,
      activeCustomers: users.filter(u => u.bookings.length > 0).length
    };
  }

  // Financial performance report
  async getFinancialPerformanceReport(parameters, companyId) {
    const { startDate, endDate } = parameters;
    const whereClause = companyId ? { companyId } : {};

    const [bookings, walletTransactions] = await Promise.all([
      Booking.findAll({
        where: {
          ...whereClause,
          createdAt: { [Op.between]: [startDate, endDate] }
        }
      }),
      WalletTransaction.findAll({
        include: [{
          model: Wallet,
          as: 'wallet',
          include: [{
            model: User,
            as: 'user',
            where: whereClause
          }]
        }],
        where: {
          createdAt: { [Op.between]: [startDate, endDate] }
        }
      })
    ]);

    const financialMetrics = this.calculateFinancialMetrics(bookings, walletTransactions);
    
    return {
      reportType: 'financial_performance',
      parameters,
      financialMetrics
    };
  }

  // Operational metrics report
  async getOperationalMetricsReport(parameters, companyId) {
    const { startDate, endDate } = parameters;
    const whereClause = companyId ? { companyId } : {};

    const bookings = await Booking.findAll({
      where: {
        ...whereClause,
        createdAt: { [Op.between]: [startDate, endDate] }
      },
      include: [
        { model: User, as: 'user' },
        { model: Flight, as: 'flight' }
      ]
    });

    const operationalMetrics = this.calculateOperationalMetrics(bookings);
    
    return {
      reportType: 'operational_metrics',
      parameters,
      operationalMetrics
    };
  }

  // Flight performance report
  async getFlightPerformanceReport(parameters, companyId) {
    const { startDate, endDate } = parameters;
    const whereClause = companyId ? { companyId } : {};

    const bookings = await Booking.findAll({
      where: {
        ...whereClause,
        createdAt: { [Op.between]: [startDate, endDate] }
      },
      include: [
        { model: Flight, as: 'flight' }
      ]
    });

    const flightPerformance = this.analyzeFlightPerformance(bookings);
    
    return {
      reportType: 'flight_performance',
      parameters,
      flightPerformance
    };
  }

  // Wallet analysis report
  async getWalletAnalysisReport(parameters, companyId) {
    const { startDate, endDate } = parameters;
    const whereClause = companyId ? { companyId } : {};

    const walletTransactions = await WalletTransaction.findAll({
      include: [{
        model: Wallet,
        as: 'wallet',
        include: [{
          model: User,
          as: 'user',
          where: whereClause
        }]
      }],
      where: {
        createdAt: { [Op.between]: [startDate, endDate] }
      }
    });

    const walletAnalysis = this.analyzeWalletTransactions(walletTransactions);
    
    return {
      reportType: 'wallet_analysis',
      parameters,
      walletAnalysis
    };
  }

  // Generate file (Excel, PDF, CSV)
  async generateFile(reportType, data, format, reportId) {
    const fileName = `${reportType}_${reportId}_${Date.now()}.${format}`;
    const filePath = path.join(this.outputDir, fileName);

    switch (format) {
      case 'excel':
        return await this.generateExcelFile(data, filePath);
      case 'pdf':
        return await this.generatePDFFile(data, filePath);
      case 'csv':
        return await this.generateCSVFile(data, filePath);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  // Generate Excel file
  async generateExcelFile(data, filePath) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report');

    // Add headers
    const headers = this.getHeadersForReport(data.reportType);
    worksheet.addRow(headers);

    // Add data
    if (data.summary) {
      Object.entries(data.summary).forEach(([date, metrics]) => {
        worksheet.addRow([date, metrics.bookings, metrics.revenue, metrics.averageValue]);
      });
    }

    await workbook.xlsx.writeFile(filePath);
    return filePath;
  }

  // Generate PDF file
  async generatePDFFile(data, filePath) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);
      
      // Add title
      doc.fontSize(20).text(`${data.reportType.replace(/_/g, ' ').toUpperCase()}`, { align: 'center' });
      doc.moveDown();
      
      // Add summary
      doc.fontSize(14).text('Summary');
      doc.fontSize(12).text(`Total Bookings: ${data.totalBookings || 0}`);
      doc.fontSize(12).text(`Total Revenue: $${data.totalRevenue || 0}`);
      doc.fontSize(12).text(`Average Booking Value: $${data.averageBookingValue || 0}`);
      
      doc.end();
      
      stream.on('finish', () => resolve(filePath));
      stream.on('error', reject);
    });
  }

  // Generate CSV file
  async generateCSVFile(data, filePath) {
    const headers = this.getHeadersForReport(data.reportType);
    let csvContent = headers.join(',') + '\n';

    if (data.summary) {
      Object.entries(data.summary).forEach(([date, metrics]) => {
        csvContent += `${date},${metrics.bookings},${metrics.revenue},${metrics.averageValue}\n`;
      });
    }

    fs.writeFileSync(filePath, csvContent);
    return filePath;
  }

  // Helper methods
  groupBookingsByDate(bookings, groupBy) {
    const grouped = {};
    
    bookings.forEach(booking => {
      let dateKey;
      switch (groupBy) {
        case 'day':
          dateKey = moment(booking.createdAt).format('YYYY-MM-DD');
          break;
        case 'week':
          dateKey = moment(booking.createdAt).format('YYYY-[W]WW');
          break;
        case 'month':
          dateKey = moment(booking.createdAt).format('YYYY-MM');
          break;
        default:
          dateKey = moment(booking.createdAt).format('YYYY-MM-DD');
      }

      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          bookings: 0,
          revenue: 0,
          averageValue: 0
        };
      }

      grouped[dateKey].bookings++;
      grouped[dateKey].revenue += booking.totalAmount;
    });

    // Calculate averages
    Object.keys(grouped).forEach(key => {
      grouped[key].averageValue = grouped[key].revenue / grouped[key].bookings;
    });

    return grouped;
  }

  breakdownRevenue(bookings, breakdown) {
    const grouped = {};
    
    bookings.forEach(booking => {
      let key;
      switch (breakdown) {
        case 'airline':
          key = booking.flight?.airline?.name || 'Unknown';
          break;
        case 'route':
          key = `${booking.flight?.origin}-${booking.flight?.destination}`;
          break;
        case 'cabin_class':
          key = booking.cabinClass;
          break;
        default:
          key = moment(booking.createdAt).format('YYYY-MM');
      }

      if (!grouped[key]) {
        grouped[key] = {
          bookings: 0,
          revenue: 0,
          averageValue: 0
        };
      }

      grouped[key].bookings++;
      grouped[key].revenue += booking.totalAmount;
    });

    // Calculate averages
    Object.keys(grouped).forEach(key => {
      grouped[key].averageValue = grouped[key].revenue / grouped[key].bookings;
    });

    return grouped;
  }

  calculateRevenueGrowth(bookings, breakdown) {
    // Implementation for revenue growth calculation
    return {
      currentPeriod: 0,
      previousPeriod: 0,
      growthRate: 0
    };
  }

  analyzeCustomerBehavior(users) {
    const behavior = {
      totalCustomers: users.length,
      activeCustomers: users.filter(u => u.bookings.length > 0).length,
      averageBookingsPerCustomer: 0,
      customerSegments: {
        highValue: 0,
        frequent: 0,
        occasional: 0,
        inactive: 0
      }
    };

    if (users.length > 0) {
      const totalBookings = users.reduce((sum, u) => sum + u.bookings.length, 0);
      behavior.averageBookingsPerCustomer = totalBookings / users.length;

      users.forEach(user => {
        const totalSpent = user.bookings.reduce((sum, b) => sum + b.totalAmount, 0);
        const bookingCount = user.bookings.length;

        if (totalSpent > 10000 && bookingCount > 10) {
          behavior.customerSegments.highValue++;
        } else if (bookingCount > 5) {
          behavior.customerSegments.frequent++;
        } else if (bookingCount > 0) {
          behavior.customerSegments.occasional++;
        } else {
          behavior.customerSegments.inactive++;
        }
      });
    }

    return behavior;
  }

  calculateFinancialMetrics(bookings, walletTransactions) {
    const totalRevenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const totalTransactions = walletTransactions.length;
    const totalTransactionValue = walletTransactions.reduce((sum, t) => sum + t.amount, 0);

    return {
      totalRevenue,
      totalTransactions,
      totalTransactionValue,
      averageTransactionValue: totalTransactions > 0 ? totalTransactionValue / totalTransactions : 0,
      revenueGrowth: 0,
      transactionGrowth: 0
    };
  }

  calculateOperationalMetrics(bookings) {
    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
    const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;

    return {
      totalBookings,
      confirmedBookings,
      cancelledBookings,
      confirmationRate: totalBookings > 0 ? (confirmedBookings / totalBookings) * 100 : 0,
      cancellationRate: totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0,
      averageProcessingTime: 0
    };
  }

  analyzeFlightPerformance(bookings) {
    const flightStats = {};
    
    bookings.forEach(booking => {
      const route = `${booking.flight?.origin}-${booking.flight?.destination}`;
      if (!flightStats[route]) {
        flightStats[route] = {
          bookings: 0,
          revenue: 0,
          averageValue: 0
        };
      }
      
      flightStats[route].bookings++;
      flightStats[route].revenue += booking.totalAmount;
    });

    // Calculate averages
    Object.keys(flightStats).forEach(route => {
      flightStats[route].averageValue = flightStats[route].revenue / flightStats[route].bookings;
    });

    return flightStats;
  }

  analyzeWalletTransactions(transactions) {
    const analysis = {
      totalTransactions: transactions.length,
      totalValue: transactions.reduce((sum, t) => sum + t.amount, 0),
      transactionTypes: {},
      averageTransactionValue: 0
    };

    transactions.forEach(transaction => {
      const type = transaction.type;
      if (!analysis.transactionTypes[type]) {
        analysis.transactionTypes[type] = {
          count: 0,
          totalValue: 0
        };
      }
      
      analysis.transactionTypes[type].count++;
      analysis.transactionTypes[type].totalValue += transaction.amount;
    });

    analysis.averageTransactionValue = analysis.totalTransactions > 0 ? 
      analysis.totalValue / analysis.totalTransactions : 0;

    return analysis;
  }

  getHeadersForReport(reportType) {
    switch (reportType) {
      case 'booking_summary':
        return ['Date', 'Bookings', 'Revenue', 'Average Value'];
      case 'revenue_analysis':
        return ['Category', 'Bookings', 'Revenue', 'Average Value'];
      default:
        return ['Metric', 'Value'];
    }
  }

  async createReportRecord(reportType, parameters, companyId, format) {
    return await Report.create({
      name: `${reportType.replace(/_/g, ' ')} Report`,
      type: 'custom',
      parameters,
      format,
      status: 'processing',
      generatedBy: parameters.userId,
      companyId
    });
  }

  loadReportTemplates() {
    return {
      booking_summary: {
        name: 'Booking Summary Report',
        description: 'Summary of bookings by date range',
        parameters: ['startDate', 'endDate', 'groupBy']
      },
      revenue_analysis: {
        name: 'Revenue Analysis Report',
        description: 'Revenue breakdown and analysis',
        parameters: ['startDate', 'endDate', 'breakdown']
      }
    };
  }

  ensureOutputDirectory() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }
}

module.exports = new ReportService();