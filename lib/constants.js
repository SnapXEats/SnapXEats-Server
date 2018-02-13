const keys = {
  DB: {
    STATUS: {
      ACTIVE: 'active',
      INACTIVE: 'inactive',
      PENDING: 'pending',
      DELETE: 'deleted'
    }
  },
  USER_TYPE : {
    LOCAL : 'local',
    ADMIN: 'admin'
  },
  LOGIN_TYPE : {
    LOCAL : 'local',
    SOCIAL : 'social'
  },
  SECRET : process.env.secret,
  userRoles: ['local', 'admin'],
  SOCIAL_PLATFORM : {
    FACEBOOK : 'facebook',
    INSTAGRAM : 'instagram'
  },
  USER_GESTURE : {
    LIKE_BY_USER : 'like_by_user',
    DISLIKE_BY_USER : 'dislike_by_user',
    WISHLIST_OF_USER : 'wishlist_of_user'
  },
};

module.exports = keys;
