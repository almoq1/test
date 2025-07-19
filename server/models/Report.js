const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Report = sequelize.define('Report', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('dashboard', 'financial', 'operational', 'customer', 'custom'),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    parameters: {
      type: DataTypes.JSONB,
      allowNull: true,
      get() {
        const rawValue = this.getDataValue('parameters');
        return rawValue ? JSON.parse(rawValue) : null;
      },
      set(value) {
        this.setDataValue('parameters', JSON.stringify(value));
      }
    },
    data: {
      type: DataTypes.JSONB,
      allowNull: true,
      get() {
        const rawValue = this.getDataValue('data');
        return rawValue ? JSON.parse(rawValue) : null;
      },
      set(value) {
        this.setDataValue('data', JSON.stringify(value));
      }
    },
    format: {
      type: DataTypes.ENUM('json', 'csv', 'pdf', 'excel'),
      defaultValue: 'json'
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
      defaultValue: 'pending'
    },
    filePath: {
      type: DataTypes.STRING,
      allowNull: true
    },
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    generatedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    companyId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'companies',
        key: 'id'
      }
    },
    isScheduled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    scheduleConfig: {
      type: DataTypes.JSONB,
      allowNull: true,
      get() {
        const rawValue = this.getDataValue('scheduleConfig');
        return rawValue ? JSON.parse(rawValue) : null;
      },
      set(value) {
        this.setDataValue('scheduleConfig', JSON.stringify(value));
      }
    },
    lastGenerated: {
      type: DataTypes.DATE,
      allowNull: true
    },
    nextGeneration: {
      type: DataTypes.DATE,
      allowNull: true
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    processingTime: {
      type: DataTypes.INTEGER, // in milliseconds
      allowNull: true
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    tags: {
      type: DataTypes.JSONB,
      defaultValue: []
    }
  }, {
    tableName: 'reports',
    timestamps: true,
    indexes: [
      {
        fields: ['type']
      },
      {
        fields: ['status']
      },
      {
        fields: ['generatedBy']
      },
      {
        fields: ['companyId']
      },
      {
        fields: ['isScheduled']
      },
      {
        fields: ['createdAt']
      }
    ]
  });

  Report.associate = (models) => {
    Report.belongsTo(models.User, {
      foreignKey: 'generatedBy',
      as: 'generator'
    });
    
    Report.belongsTo(models.Company, {
      foreignKey: 'companyId',
      as: 'company'
    });
  };

  return Report;
};