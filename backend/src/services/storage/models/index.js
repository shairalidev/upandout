export function initModels(sequelize, DataTypes) {
  const User = sequelize.define('User', {
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    password_hash: { type: DataTypes.STRING, allowNull: false }
  }, { underscored: true });

  const Item = sequelize.define('Item', {
    sourcePostId: { type: DataTypes.STRING, unique: true },
    source: DataTypes.STRING,
    caption: DataTypes.TEXT,
    likes: DataTypes.INTEGER,
    views: DataTypes.INTEGER,
    timestamp: DataTypes.DATE,
    // AI-enriched fields
    placeName: DataTypes.STRING,
    address: DataTypes.STRING,
    atmosphere: DataTypes.STRING,
    loudness: DataTypes.STRING,
    lighting: DataTypes.STRING,
    recurringEntertainment: DataTypes.STRING,
    priceRange: DataTypes.STRING,
    reviewSummary: DataTypes.TEXT,
    yelpStars: DataTypes.FLOAT,
    // Postgres arrays for fast filters
    groups: { type: DataTypes.ARRAY(DataTypes.TEXT), defaultValue: [] },
    experiences: { type: DataTypes.ARRAY(DataTypes.TEXT), defaultValue: [] }
  }, { underscored: true });

  const Media = sequelize.define('Media', {
    url: DataTypes.STRING,
    provider: DataTypes.STRING
  }, { underscored: true });

  const Hashtag = sequelize.define('Hashtag', {
    tag: { type: DataTypes.STRING, unique: true }
  }, { underscored: true });

  Item.hasMany(Media, { as: 'media', foreignKey: 'item_id' });
  Media.belongsTo(Item, { foreignKey: 'item_id' });

  Item.belongsToMany(Hashtag, { through: 'item_hashtags', as: 'hashtags', foreignKey: 'item_id' });
  Hashtag.belongsToMany(Item, { through: 'item_hashtags', as: 'items', foreignKey: 'hashtag_id' });

  return { User, Item, Media, Hashtag, sequelize };
}
