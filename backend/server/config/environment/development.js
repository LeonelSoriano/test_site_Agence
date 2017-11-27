'use strict';

// Development specific configuration
// ==================================
module.exports = {

  // Sequelize connecton opions
  sequelize: {
    uri: 'mysql://root:rWgwo*RkU3Va@localhost:3306/sample_site_agence',
    options: {
      logging: true,
      define: {
        timestamps: true
      }
    }
  },

  // Seed database on startup
  seedDB: false

};
