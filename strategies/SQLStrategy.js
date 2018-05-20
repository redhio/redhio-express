const Knex = require('knex');

const defaultConfig = {
  dialect: 'sqlite3',
  useNullAsDefault: true,
  connection: {
    filename: './db.sqlite3',
  },
};

module.exports = class SQLStrategy {
  constructor(config = defaultConfig) {
    this.knex = Knex(config);
  }

  initialize() {
    return this.knex.schema.createTableIfNotExists('shops', table => {
      table.increments('id');
      table.string('redhio_domain');
      table.string('access_token');
      table.unique('redhio_domain');
    });
  }

  async storeShop({ shop, accessToken }) {
    await this.knex.raw(
      `INSERT OR IGNORE INTO shops (redhio_domain, access_token) VALUES ('${shop}', '${accessToken}')`
    );

    return {accessToken};
  }

  getShop({ shop }) {
    return this.knex('shops').where('redhio_domain', shop)
  }
};
