'use strict';

const appRoot = require('app-root-path');

const db = require(`${appRoot}/server/models`);

const co = require('co');

const moment = require('moment');

const _ = require('underscore');

db.userRewards.belongsTo(db.restaurantInfo, {
  foreignKey: 'restaurant_info_id'
});

db.userRewards.hasMany(db.userRewardDish, {
  foreignKey: 'user_reward_id'
});

db.userRewardDish.belongsTo(db.restaurantDish, {
  foreignKey: 'restaurant_dish_id'
});

/**
 * collectionUnion (For merging two array)
 *
 * @returns {Array} Gives Unique Array
 *
 */
function collectionUnion() {
  let args = Array.prototype.slice.call(arguments);
  let it = args.pop();

  return _.uniq(_.flatten(args, true), it);
}

/**
 * getLastWeekOfDates (Find last week of days using moment)
 *
 * @returns {Array} datesOfDays - dates of last week
 *
 */
function getLastWeekOfDates(){
  return co(function* () {
    let datesOfDays = [];
    let todayStartDate = moment().format('YYYY-MM-DD 00:00:00');
    let todayEndDate = moment().format('YYYY-MM-DD 23:59:59');
    datesOfDays.push({
      startDate : todayStartDate,
      endDate : todayEndDate
    });
    let count;
    for(count=-1; count>-7; count--){
      let startDate = moment(todayStartDate).add(count, 'days').format('YYYY-MM-DD 00:00:00');
      let endDate = moment(todayStartDate).add(count, 'days').format('YYYY-MM-DD 23:59:59');
      datesOfDays.push({
        startDate:startDate,
        endDate:endDate
      });
    }

    if(count === -7){
      return datesOfDays;
    }
  }).catch((err) => {
    return err;
  });
}

/**
 * findUserRewards (Find users rewards for past and current week)
 * @param {Array} week - Dates of current week
 * @param {Array} userId - Unique id of user
 *
 *
 * @returns {ArrayOfObject} rewardHistory(Contains history of user rewards)
 *
 */
function findUserRewards(week, userId){
  return co(function* () {
    let count;
    let rewardHistory = [];
    for(count = 0; count < week.length; count++){
      let user_rewards = yield db.userRewards.findAll({
        where : {
          user_id : userId,
          created_at : {
            $gte : week[count].startDate,
            $lte : week[count].endDate
          }
        },
        include : [{
          model : db.restaurantInfo,
          attributes : ['restaurant_name', 'restaurant_address'],
          include : [{
            model : db.restaurantDish,
            attributes : ['dish_image_url'],
            include:[{
              model : db.restaurantDishLabel,
              attributes : ['dish_label'],
              where : {
                dish_label: {
                  $like : `%dish%`
                }
              }
            }]
          }]
        },{
          model : db.userRewardDish,
          attributes : ['restaurant_dish_id'],
          include : [{
            model : db.restaurantDish,
            attributes : ['dish_image_url']
          }]
        }]
      });
      if(user_rewards && user_rewards.length > 0){
        rewardHistory.push(user_rewards);
      }
    }

    let rewardOlderHistory = yield db.userRewards.findAll({
      where : {
        user_id : userId,
        created_at : {
          $lte : week[count - 1].startDate
        }
      },
      include : [{
        model : db.restaurantInfo,
        attributes : ['restaurant_name', 'restaurant_address'],
        include : [{
          model : db.restaurantDish,
          attributes : ['dish_image_url'],
          include:[{
            model : db.restaurantDishLabel,
            attributes : ['dish_label'],
            where : {
              dish_label: {
                $like : `%dish%`
              }
            }
          }]
        }]
      }]
    });
    if(count === week.length){
      return {
        rewardHistory,
        rewardOlderHistory
      };
    }
  }).catch((err) => {
    return err;
  });
}


/**
 * isBothRewardFromSameRestaurant (Check both rewarded restaurant is same or not)
 * @param {Array} reward - Rewards data of user
 *
 *
 * @returns {Array} uniqueRewards(Returns unique rewards)
 *
 */
function isBothRewardFromSameRestaurant(reward){
  return co(function* () {
    let count;
    let uniqueRewards = [];
    _.sortBy( reward, function( item ) { return -item.restaurant_info_id; } );
    for(count = 0; count < reward.length; count++){
      let rewardFromRestaurant = reward[count];
      let index = _.findIndex(uniqueRewards, {
        restaurant_info_id: rewardFromRestaurant.restaurant_info_id
      });
      if(index === -1){
        uniqueRewards.push(rewardFromRestaurant);
      } else {
        uniqueRewards[index].reward_point += rewardFromRestaurant.reward_point;
        let result = collectionUnion(uniqueRewards[index].userRewardDishes,rewardFromRestaurant.userRewardDishes, function (item) {
          return item.restaurant_dish_id;
        });

        let filteredResult = _.pluck(result, 'restaurantDish');
        uniqueRewards[index].reward_dishes = _.pluck(filteredResult, 'dish_image_url');
      }
    }

    if(count === reward.length){
      return uniqueRewards;
    }
  }).catch((err) => {
    return err;
  });
}
/**
 * filterUserRewardHistoryForLastWeek (Filtered awards)
 * @param {Array} rewardHistory - Rewards data of user
 *
 *
 * @returns {Array} FilteredRewards(Returns rewards record)
 *
 */
function filterUserRewardHistoryForLastWeek(rewardHistory){
  return co(function* () {
    let count;
    let rewardHistoryForCurrentWeek = [];
    for(count = 0; count < rewardHistory.length; count++){
      let reward = rewardHistory[count];
      let today = moment().format('YYYY-MM-DD');
      if(reward.length > 1){
        let foodUniqueHistory = yield isBothRewardFromSameRestaurant(reward);
        for(let countForUniqueHistory = 0; countForUniqueHistory<foodUniqueHistory.length; countForUniqueHistory++){
          let rewardDate = moment(foodUniqueHistory[countForUniqueHistory].created_at).format('YYYY-MM-DD');
          let user_add_array = foodUniqueHistory[countForUniqueHistory].restaurantInfo.restaurant_address.split(',');
          let restaurant_address = user_add_array[1];
          let jsonForFoodJourney = {
            restaurant_info_id : foodUniqueHistory[countForUniqueHistory].restaurant_info_id,
            reward_point : foodUniqueHistory[countForUniqueHistory].reward_point,
            restaurant_name : foodUniqueHistory[countForUniqueHistory].restaurantInfo.restaurant_name,
            restaurant_image_url : foodUniqueHistory[countForUniqueHistory].restaurantInfo.restaurantDishes[0].dish_image_url,
            restaurant_address : restaurant_address.trim(),
            reward_dishes : foodUniqueHistory[countForUniqueHistory].reward_dishes || []
          };
          if(today === rewardDate){
            jsonForFoodJourney.formattedDate = 'Today';
          } else {
            jsonForFoodJourney.formattedDate = moment(foodUniqueHistory[countForUniqueHistory].created_at).format("dddd, MMMM Do YYYY");
          }
          rewardHistoryForCurrentWeek.push(jsonForFoodJourney);
        }
      } else {
        let rewardDate = moment(reward[0].created_at).format('YYYY-MM-DD');
        let user_add_array = reward[0].restaurantInfo.restaurant_address.split(',');
        let restaurant_address = user_add_array[1];
        let jsonForFoodJourney = {
          restaurant_info_id : reward[0].restaurant_info_id,
          reward_point : reward[0].reward_point,
          restaurant_name : reward[0].restaurantInfo.restaurant_name,
          restaurant_address : restaurant_address.trim(),
          reward_dishes : reward[0].userRewardDishes,
          restaurant_image_url : reward[0].restaurantInfo.restaurantDishes[0].dish_image_url
        };
        if(today === rewardDate){
          jsonForFoodJourney.formattedDate = 'Today';
        } else {
          jsonForFoodJourney.formattedDate = moment(reward[0].created_at).format("dddd, MMMM Do YYYY");
        }
        rewardHistoryForCurrentWeek.push(jsonForFoodJourney);
      }
    }

    if(count === rewardHistory.length){
      return rewardHistoryForCurrentWeek;
    }
  }).catch((err) => {
    return err;
  });
}

/**
 * formattedUserPastFoodHistory (Return Formatted awards)
 * @param {Array} rewardHistory - Rewards data of user
 *
 *
 * @returns {Array} FormattedRewards(Returns rewards record)
 *
 */
function formattedUserPastFoodHistory(rewardHistory){
  return co(function* () {
    let count;
    let rewardHistoryForPast = [];
    for(count = 0; count < rewardHistory.length; count++){
      let reward = rewardHistory[count];
      let user_add_array = reward.restaurantInfo.restaurant_address.split(',');
      let restaurant_address = user_add_array[1];
      let jsonForFoodJourney = {
        restaurant_info_id : reward.restaurant_info_id,
        reward_point : reward.reward_point,
        restaurant_name : reward.restaurantInfo.restaurant_name,
        restaurant_address : restaurant_address.trim(),
        formattedDate : moment(reward.created_at).format("DD-MM-YYYY"),
        restaurant_image_url : reward.restaurantInfo.restaurantDishes[0].dish_image_url
      };
      rewardHistoryForPast.push(jsonForFoodJourney);
    }

    if(count === rewardHistory.length){
      return rewardHistoryForPast;
    }
  }).catch((err) => {
    return err;
  });
}

/**
 * filterUserRewardHistoryForPast (Return Filtered awards)
 * @param {Array} rewardHistory - Rewards data of user
 *
 *
 * @returns {Array} FilteredRewards(Returns rewards record)
 *
 */
function filterUserRewardHistoryForPast(rewardHistory){
  return co(function* () {
    let count;
    let rewardHistoryForPast = [];
    for(count = 0; count < rewardHistory.length; count++) {
      let reward = rewardHistory[count];
      let index = _.findIndex(rewardHistoryForPast, {
        restaurant_info_id: reward.restaurant_info_id,
        formattedDate : reward.formattedDate
      });
      if(index === -1){
        rewardHistoryForPast.push(reward);
      } else {
        rewardHistoryForPast[index].reward_point += reward.reward_point;
      }
    }

    rewardHistoryForPast.forEach(function(data) {
      let parts = data.formattedDate.split('-');
      data.formattedDate = new Date(+parts[2], +parts[1], +parts[0]);
    });

    rewardHistoryForPast.sort(function(prevDate, nextDate) {
      return prevDate.formattedDate - nextDate.formattedDate;
    });

    if(count === rewardHistory.length){
      return rewardHistoryForPast.reverse();
    }
  }).catch((err) => {
    return err;
  });
}

/**
 * @swagger
 * definition:
 *   currentWeekHistory:
 *     type: object
 *     properties:
 *       restaurant_info_id:
 *         type: string
 *       restaurant_name:
 *         type: string
 *       reward_point:
 *         type: integer
 *       restaurant_image_url:
 *         type: string
 *       restaurant_address:
 *         type: string
 *       reward_dishes:
 *         type: array
 *         items:
 *           type: string
 *       formattedDate:
 *         type: string
 */

/**
 * @swagger
 * definition:
 *   userPastHistory:
 *     type: object
 *     properties:
 *       restaurant_info_id:
 *         type: string
 *       restaurant_name:
 *         type: string
 *       reward_point:
 *         type: integer
 *       restaurant_image_url:
 *         type: string
 *       restaurant_address:
 *         type: string
 *       formattedDate:
 *         type: string
 */

/**
 * @swagger
 * definition:
 *   userFoodJourney:
 *     type: object
 *     properties:
 *       userCurrentWeekHistory:
 *         type: array
 *         items:
 *           $ref: "#/definitions/currentWeekHistory"
 *       userPastHistory:
 *         type: array
 *         items:
 *           $ref: "#/definitions/userPastHistory"
 */

/**
 * @swagger
 * /api/v1/foodJourney:
 *   get:
 *     summary: List out food journey of user
 *     description: List out food journey of user as an JSON array
 *     parameters:
 *      - in: header
 *        name: Authorization
 *        description: an authorization header (Bearer eyJhbGciOiJI...)
 *        type: string
 *        required : true
 *     tags:
 *       - FoodJourney
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: "successful operation"
 *         schema:
 *           type: object
 *           "$ref": "#/definitions/userFoodJourney"
 */
exports.getFoodJourney = function (req, res) {
  return co(function* () {
    let userId = req.decodedData.user_id;
    let week = yield getLastWeekOfDates();
    let userFoodHistory = yield findUserRewards(week,userId);
    let userCurrentWeekHistory = yield filterUserRewardHistoryForLastWeek(userFoodHistory.rewardHistory);
    let userFilteredPastHistory = yield formattedUserPastFoodHistory(userFoodHistory.rewardOlderHistory);
    let userPastHistory = yield filterUserRewardHistoryForPast(userFilteredPastHistory);

    return {
      userCurrentWeekHistory,
      userPastHistory
    };

  }).then((foodJourneydata) => {
    res.status(200)
      .json({
        userCurrentWeekHistory : foodJourneydata.userCurrentWeekHistory,
        userPastHistory : foodJourneydata.userPastHistory
      });
  }).catch((err) => {
    console.log(err);
    res.status(400).json(err);
  });
};
