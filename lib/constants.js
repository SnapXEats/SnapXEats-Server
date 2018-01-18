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
  }
};

module.exports = keys;
