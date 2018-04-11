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
  USER_REWARDS : {
    RESTAURANT_CHECK_IN : 'restaurant_check_in',
    REWARD_POINT_FOR_CHECK_IN : 50,
    SNAP_AND_SHARE : 'snap_and_share',
    REWARD_POINT_FOR_SHARE : 50,
  },
  MESSAGE_FOR_SNAPNSHARE : `%s Get reward points at #%s #SnapXEats
  Click on the link below to avail this deal
  
  %s`
};

module.exports = keys;
