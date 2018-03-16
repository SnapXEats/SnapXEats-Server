'use strict';

const appRoot = require('app-root-path');

const co = require('co');

const db = require(`${appRoot}/server/models`);

const fs = require('fs');

let S3FS = require('s3fs');

let s3fsImpl = new S3FS('filetoupload', {
  accessKeyId: 'AKIAJIBHIWJNAVDWTZWQ',
  secretAccessKey: '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',
  signatureVersion: 'v4',
  region: 'us-east-2'
});

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
 *        - in: formData
 *          name: dishPicture
 *          description: dish picture file to upload
 *          required: false
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
    if(restaurant_info_id && restaurant_rating && dishPic && (audioReview || textReview)){
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
      return({
        restaurant_name : reviewInformation.restaurant_name,
        dish_image_url : dishLink,
        restaurant_dish_id : dishInformation.restaurant_dish_id
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
