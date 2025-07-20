'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('flights', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      airline_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'airlines',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      flight_number: {
        type: Sequelize.STRING,
        allowNull: false
      },
      origin: {
        type: Sequelize.STRING,
        allowNull: false
      },
      destination: {
        type: Sequelize.STRING,
        allowNull: false
      },
      departure_time: {
        type: Sequelize.DATE,
        allowNull: false
      },
      arrival_time: {
        type: Sequelize.DATE,
        allowNull: false
      },
      aircraft_type: {
        type: Sequelize.STRING
      },
      total_seats: {
        type: Sequelize.INTEGER
      },
      available_seats: {
        type: Sequelize.INTEGER
      },
      economy_price: {
        type: Sequelize.DECIMAL(10, 2)
      },
      business_price: {
        type: Sequelize.DECIMAL(10, 2)
      },
      first_class_price: {
        type: Sequelize.DECIMAL(10, 2)
      },
      status: {
        type: Sequelize.ENUM('scheduled', 'boarding', 'departed', 'arrived', 'cancelled', 'delayed'),
        defaultValue: 'scheduled'
      },
      gate: {
        type: Sequelize.STRING
      },
      terminal: {
        type: Sequelize.STRING
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
    await queryInterface.dropTable('flights');
  }
};
