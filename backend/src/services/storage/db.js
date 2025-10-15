import dotenv from 'dotenv';
dotenv.config();

import { Sequelize, DataTypes, Op } from 'sequelize';
import { initModels } from './models/index.js';


let sequelize;
let models;

async function createSequelize() {
  const {
    DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS, DB_SSL
  } = process.env;

  const config = {
    host: DB_HOST || '127.0.0.1',
    port: Number(DB_PORT || 5432),
    dialect: 'postgres',
    logging: false,
    pool: { max: 15, min: 2, acquire: 20000, idle: 10000 }
  };

  if (String(DB_SSL || '').toLowerCase() === 'true') {
    config.dialectOptions = { ssl: { require: true, rejectUnauthorized: false } };
  }

  return new Sequelize(DB_NAME, DB_USER, DB_PASS, config);
}

export async function ensureModels() {
  if (models) return models;

  sequelize = await createSequelize();
  models = initModels(sequelize, DataTypes);

  // 1) create tables
  await sequelize.sync();

  // 2) then create extensions & indexes
  await initExtensionsAndIndexes();

  return models;
}


async function initExtensionsAndIndexes() {
  // Extension (idempotent)
  await sequelize.query('CREATE EXTENSION IF NOT EXISTS pg_trgm;');

  // Use Sequelize’s queryGenerator to safely quote table/columns
  const qi = sequelize.getQueryInterface();
  const qg = qi.queryGenerator;

  // In Sequelize v6, getTableName() may return string or { schema, tableName }
  const itemTbl = qg.quoteTable(models.Item.getTableName());

  // Because models use underscored: true, columns are snake_case in DB
  const q = (col) => qg.quoteIdentifier(col);

  // BTREE indexes
  await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_items_updated_at ON ${itemTbl} (${q('updated_at')} DESC);`);
  await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_items_views      ON ${itemTbl} (${q('views')});`);
  await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_items_likes      ON ${itemTbl} (${q('likes')});`);
  await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_items_timestamp  ON ${itemTbl} (${q('timestamp')});`);

  // GIN indexes (arrays + trigram)
  await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_items_groups_gin       ON ${itemTbl} USING GIN (${q('groups')});`);
  await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_items_experiences_gin  ON ${itemTbl} USING GIN (${q('experiences')});`);
  await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_items_caption_trgm     ON ${itemTbl} USING GIN (${q('caption')} gin_trgm_ops);`);
  await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_items_place_trgm       ON ${itemTbl} USING GIN (${q('place_name')} gin_trgm_ops);`);
}



export async function upsertItemWithMedia(payload) {
  const { Item, Media, Hashtag } = await ensureModels();

  const [item] = await Item.upsert({
    sourcePostId: payload.sourcePostId,
    source: payload.source || 'instagram',
    caption: payload.caption || '',
    likes: payload.likes || 0,
    views: payload.views || 0,
    timestamp: payload.timestamp || null,
    placeName: payload.placeName || null,
    address: payload.address || null,
    atmosphere: payload.atmosphere || null,
    loudness: payload.loudness || null,
    lighting: payload.lighting || null,
    recurringEntertainment: payload.recurringEntertainment || null,
    priceRange: payload.priceRange || null,
    reviewSummary: payload.reviewSummary || null,
    yelpStars: payload.yelpStars ?? null,
    groups: payload.groups || [],
    experiences: payload.experiences || []
  }, { returning: true });

  if (payload.imageUrl) {
    await Media.findOrCreate({
      where: { itemId: item.id, url: payload.imageUrl },
      defaults: { provider: 'ai-suggested' }
    });
  }

  for (const tag of payload.hashtags || []) {
    const [h] = await Hashtag.findOrCreate({ where: { tag } });
    await item.addHashtag(h);
  }

  return await findItemById(item.id);
}

export async function findItemById(id) {
  const { Item, Media, Hashtag } = await ensureModels();
  return Item.findByPk(id, {
    include: [{ model: Media, as: 'media' }, { model: Hashtag, as: 'hashtags' }]
  });
}

export async function findItems({ limit = 20, groups = [], experiences = [] }) {
  const { Item, Media } = await ensureModels();

  const where = {};
  if (groups.length) where.groups = { [Op.overlap]: groups };
  if (experiences.length) where.experiences = { [Op.overlap]: experiences };

  return Item.findAll({
    where,
    order: [['updatedAt', 'DESC']],
    limit,
    include: [{ model: Media, as: 'media' }]
  });
}
