'use strict';

const appRoot = require('app-root-path');

const co = require('co');

const db = require(`${appRoot}/server/models`);

const fs = require('fs');

let S3FS = require('s3fs');

const util = require('util');

const CONSTANTS = require('./../../../../lib/constants');

let vision = require('@google-cloud/vision');
const client = new vision.v1.ImageAnnotatorClient();

let s3fsImpl = new S3FS('filetoupload', {
  accessKeyId: process.env.accessKeyId,
  secretAccessKey: process.env.secretAccessKey,
  signatureVersion: process.env.signatureVersion,
  region: process.env.regionOfAWS
});

function getLabelOfImages(photoAddr) {
  const requestPicture = {
    image: {source: {imageUri: photoAddr}},
    features: [{
      type : 'LABEL_DETECTION',
      maxResults : 100
    }]
  };
  return new Promise((resolve,reject)=> {
    client
      .annotateImage(requestPicture)
      .then(labelresults => {
        const labels = labelresults[0].labelAnnotations;
        let description = [];
        let label;
        let count = 0;
        for(label = 0; label < labels.length; label++){
          description.push(labels[label].description);
        }
        if(label === labels.length){
          resolve(description);
        }
      })
      .catch(err => {
        console.error(err);
      });
  });

}

/**
 * uploadPicture
 *
 * @param {String} fileName - File name to upload file
 * @param {String}  pathOfFile - Temporary Path of file
 *
 * @returns {String} picLink - Link of file which is uploaded on AWS
 *
 */
function uploadPicture(fileName,pathOfFile) {
  return new Promise((resolve, reject) => {
    let stream = fs.createReadStream(pathOfFile);
    let filePath = "https://s3.us-east-2.amazonaws.com/filetoupload/";
    return s3fsImpl.writeFile(fileName, stream, { ACL: 'public-read' })
      .then(function (data) {
        fs.unlink(pathOfFile, function (err) {
          if (err)
            reject({
              message: err
            });
        });
        let picLink = filePath + fileName;
        resolve(picLink);

      })
      .catch(function (err) {
        reject({
          message: err
        });
      });
  });
}

/**
 * addDish
 *
 * @param {String} restaurant_info_id - Unique restaurant information id
 * @param {String}  dishLink - Link of dish which is uploaded on AWS
 *
 * @returns {Object} dishInformation
 *
 */
function addDish(restaurant_info_id, dishLink){
  return co(function* () {
   let dishInformation = yield db.restaurantDish.create({
     restaurant_info_id : restaurant_info_id,
     dish_image_url : dishLink
   });

   return Promise.resolve(dishInformation);
  }).catch((err) => {
    return err;
  });
}

/**
 * addReview
 *
 * @param {String} restaurant_dish_id - Unique dish information id
 * @param {String}  audioReviewLink - Link of audio which is uploaded on AWS
 * @param {String}  textReview - Text review of dish which is uploaded on AWS
 * @param {Integer}  restaurant_rating - Rating of restaurant
 * @param {String}  restaurant_info_id - Unique restaurant information id
 * @param {String}  user_id - Unique User information id

 *
 * @returns {Object} restaurant_info
 *
 */
function addReview(restaurant_dish_id, audioReviewLink, textReview, restaurant_rating,
                   restaurant_info_id, user_id){
  return co(function* () {
    let userReview = yield db.userReview.create({
      restaurant_dish_id : restaurant_dish_id,
      audio_review_url : audioReviewLink,
      text_review : textReview,
      rating : restaurant_rating,
      user_id : user_id
    });
    let restaurant_info = yield db.restaurantInfo.find({
      where : {
        restaurant_info_id : restaurant_info_id
      },
      attributes : ['restaurant_name']
    });
    return Promise.resolve(restaurant_info);
  }).catch((err) => {
    return err;
  });
}

/**
 * insertLabels
 *
 * @param {String} restaurant_dish_id - Unique dish information id
 * @param {Array}  label_of_dish - Labels of dish in array
 *
 * @returns {String} message
 *
 */
function insertLabels(label_of_dish,restaurant_dish_id){
  return co(function* () {
    let count;
    for(count = 0; count<label_of_dish.length; count++){
      let dish_label_info = {
        restaurant_dish_id : restaurant_dish_id,
        dish_label : label_of_dish[count]
      };

      yield db.restaurantDishLabel.create(dish_label_info);
    }

    if(count === label_of_dish.length){
      return Promise.resolve("Labels of dish inserted successfully");
    }
  }).catch((err) => {
    return err;
  });
}
/**
 * @swagger
 * definition:
 *   snapNShare:
 *     type: object
 *     properties:
 *       restaurant_name:
 *         type: string
 *       restaurant_dish_id:
 *         type: string
 *       dish_image_url:
 *         type: string
 *       message:
 *         type: string
 */

/**
 * @swagger
 * paths:
 *  /api/v1/snapNShare:
 *    post:
 *      summary: Upload photo on aws s3.
 *      tags:
 *        - Snap N Share
 *      description: Upload dish photo n audio review as a JSON object
 *      consumes:
 *        - application/json
 *      parameters:
 *        - in: header
 *          name: Authorization
 *          description: an authorization header (Bearer eyJhbGciOiJI...)
 *          required: true
 *          type: string
 *        - in: formData
 *          name: restaurantInfoId
 *          description: restaurant information unique id
 *          type: string
 *          required: true
 *        - in: formData
 *          name: dishPicture
 *          description: dish picture file to upload
 *          required: true
 *          type: file
 *        - in: formData
 *          name: audioReview
 *          description: audio review file to upload
 *          type: file
 *        - in: formData
 *          name: textReview
 *          description: text review
 *          type: string
 *        - in: formData
 *          name: rating
 *          description: rating of restaurant
 *          type: integer
 *          required: true
 *      responses:
 *        200:
 *          description: Successfully Created
 *          schema:
 *            type: object
 *            "$ref": "#/definitions/snapNShare"
 */
exports.fileUploadToS3 = function (req, res) {
  return co(function* () {
    let user_id = req.decodedData.user_id;
    let restaurant_info_id = req.body.restaurantInfoId;
    let restaurant_rating = req.body.rating;
    let textReview = req.body.textReview;
    let dishPic = req.files.dishPicture;
    let audioReview = req.files.audioReview;
    if(restaurant_info_id && restaurant_rating && dishPic){
      let dishFileName, dishLink, audioFileName, audioReviewLink;
      if(dishPic){
        dishFileName = dishPic.path.split("/tmp/");
        dishLink = yield uploadPicture(dishFileName[1], dishPic.path);
      }
      if(audioReview){
        audioFileName = audioReview.path.split("/tmp/");
        audioReviewLink = yield uploadPicture(audioFileName[1],audioReview.path);
      }

      let dishInformation = yield addDish(restaurant_info_id, dishLink);
      let reviewInformation = yield addReview(dishInformation.restaurant_dish_id,
        audioReviewLink, textReview, restaurant_rating, restaurant_info_id, user_id);
       let label_of_dish = yield getLabelOfImages(dishLink);
      if(label_of_dish && label_of_dish.length > 0){
        yield insertLabels(label_of_dish,dishInformation.restaurant_dish_id);
      }

      let userInfo = yield db.users.find({
        where : {
          user_id : user_id
        },
        attributes: ['name']
      });

      let link = `https://app.snapxeats.com/?url=snapxeats://dishes?id=${dishInformation.restaurant_dish_id}`;

      let message = util.format(CONSTANTS.MESSAGE_FOR_SNAPNSHARE,userInfo.name,
        reviewInformation.restaurant_name,link);
      return({
        restaurant_name : reviewInformation.restaurant_name,
        dish_image_url : dishLink,
        restaurant_dish_id : dishInformation.restaurant_dish_id,
        message : message
      });
    } else {
      throw new Error('Some parameter is missing in request');
    }

  }).then((data) => {
      res.status(200)
        .json(data);
  }).catch((err) => {
    res.status(400).json(err);
  });
};
