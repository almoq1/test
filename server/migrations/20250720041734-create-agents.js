'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('agents', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      agent_code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      agent_type: {
        type: Sequelize.ENUM('individual', 'agency', 'corporate', 'super_agent'),
        defaultValue: 'individual'
      },
      parent_agent_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'agents',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      company_name: {
        type: Sequelize.STRING
      },
      business_license: {
        type: Sequelize.STRING
      },
      tax_id: {
        type: Sequelize.STRING
      },
      address: {
        type: Sequelize.TEXT
      },
      city: {
        type: Sequelize.STRING
      },
      state: {
        type: Sequelize.STRING
      },
      country: {
        type: Sequelize.STRING
      },
      postal_code: {
        type: Sequelize.STRING
      },
      phone: {
        type: Sequelize.STRING
      },
      website: {
        type: Sequelize.STRING
      },
      commission_rate: {
        type: Sequelize.DECIMAL(5, 2), // percentage
        defaultValue: 5.00
      },
      bonus_rate: {
        type: Sequelize.DECIMAL(5, 2), // percentage
        defaultValue: 0.00
      },
      sub_agent_commission: {
        type: Sequelize.DECIMAL(5, 2), // percentage
        defaultValue: 0.00
      },
      minimum_payout: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 100.00
      },
      payment_method: {
        type: Sequelize.ENUM('bank_transfer', 'paypal', 'stripe', 'check'),
        defaultValue: 'bank_transfer'
      },
      payment_details: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      status: {
        type: Sequelize.ENUM('pending', 'active', 'suspended', 'terminated'),
        defaultValue: 'pending'
      },
      approval_date: {
        type: Sequelize.DATE
      },
      approved_by: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      performance_metrics: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      settings: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('agents');
  }
};
