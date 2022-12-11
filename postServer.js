const mongoose = require("mongoose");
const fs = require("fs");
const express = require("express");
const schemaData = require("./databaseSchema");
const Constants = require("./Constants");
const { response } = require("express");
const bodyParser = require("body-parser");

const port = 8000;
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

mongoose
  .connect(Constants.Url, Constants.ConnectionParams)
  .then(() => {
    console.log("Connection Successfull");
  })
  .catch((err) => {
    console.log("Error is");
    console.log(err);
  });

let userModel = mongoose.model("Users", schemaData.userSchema);
let foodLogModel = mongoose.model("FoodLog", schemaData.userFoodLogSchema);
let foodDataModel = mongoose.model("foodDataModel", schemaData.foodDataSchema);
let recipeModel = mongoose.model("userRecipe", schemaData.userRecipes);

app.get("/", async (req, res) => {
  res.sendStatus(200);
});

app.get("/apiv1/searchFood", async (req, res) => {
  return res.json({
    Message: "Hi There Connection is Successful",
    Code: 200,
    Feeling: "Mutual",
  });
});

app.get("/apiv1/profile", async (req, res) => {
  let userID = req.query.userId;
  userModel.findOne({ UserID: userID }, (err, user) => {
    if (err) {
      console.log("Error is " + err);
    }
    console.log(user);
    if (user) {
      var response = {
        name: user.Name,
        age: user.Age,
        location: user.Location,
        height: user.Height,
        weight: user.Weight,
        goal: user.GoalWeight,
      };
    } else {
      var response = {
        name: "No User",
        age: 00,
        location: "US",
        height: 00,
        weight: 00,
        goal: 00,
      };
    }
    res.json({ data: response });
  });
});

app.get("/apiv1/calorie", async (req, res) => {
  let userID = req.query.userId;
  const DateObj = new Date();
  let day = ("0" + DateObj.getDate()).slice(-2);
  let month = ("0" + (DateObj.getMonth() + 1)).slice(-2);
  let year = DateObj.getFullYear();
  let date = day + " " + month + " " + year;
  var dailyGoal = 2300;
  userModel.findOne({ UserID: userID }, (err, user) => {
    console.log("entered USERFINDONE block");
    if (err) {
      console.log(err);
    }
    if (user) {
      console.log("entered USERFINDONE IF block");
      dailyGoal = user.DailyCalorieGoal;
    } else {
      console.log("entered USERFINDONE ELSE block");
      dailyGoal = 2000;
    }
    foodLogModel.findOne({ "Data.UserID": userID }, (err, foodLog) => {
      console.log("entered FOODLOGFINDONE block");
      if (err) {
        console.log(err);
      }
      console.log("This is the foodlog " + foodLog);
      if (foodLog) {
        console.log("entered FOODLOGFINDONE IF block");
        let foodlogArray = foodLog.Data.FoodData;
        let userDayLog = foodlogArray.filter((log) => {
          return log.Date === date;
        });
        console.log("User Day Log is " + userDayLog[0]);
        if (userDayLog.length > 0) {
          var total = userDayLog[0].TotalCalories;
          var carbs = userDayLog[0].TotalCarbs;
          var protein = userDayLog[0].TotalProtein;
          var fats = userDayLog[0].TotalFats;
          var resData = {
            userId: userID,
            dailyGoal: dailyGoal,
            total: total,
            carbs: carbs,
            protein: protein,
            fats: fats,
          };
          res.json({ data: resData });
        } else {
          var resData = {
            userId: userID,
            dailyGoal: dailyGoal,
            total: 0,
            carbs: 0,
            protein: 0,
            fats: 0,
          };
          res.json({ data: resData });
        }
      } else {
        console.log("entered FOODLOGFINDONE ELSE block");
        var resData = {
          userId: userID,
          dailyGoal: dailyGoal,
          total: 1900,
          carbs: 200,
          protein: 80,
          fats: 40,
        };
        res.json({ data: resData });
      }
    });
  });
});

app.get("/apiv1/water", async (req, res) => {
  let userID = req.query.userId;
  const DateObj = new Date();
  let day = ("0" + DateObj.getDate()).slice(-2);
  let month = ("0" + (DateObj.getMonth() + 1)).slice(-2);
  let year = DateObj.getFullYear();
  let date = day + " " + month + " " + year;
  foodLogModel.findOne({ "Data.UserID": userID }, (err, foodLog) => {
    console.log("entered FINDONE block");
    if (err) {
      console.log(err);
    }
    if (foodLog) {
      console.log("entered IF block");
      let foodlogArray = foodLog.Data.FoodData;
      let userDayLog = foodlogArray.filter((log) => {
        return log.Date === date;
      });
      if (userDayLog.length > 0) {
        var resData = {
          userId: userID,
          water: userDayLog[0].WaterConsumption,
        };
        res.json({ data: resData });
      } else {
        var resData = {
          userId: userID,
          water: 0,
        };
        res.json({ data: resData });
      }
    } else {
      console.log("entered ELSE block");
      var resData = {
        userId: userID,
        water: 1500,
      };
      res.json({ data: resData });
    }
  });
});

app.get("/apiv1/searchMeal", async (req, res) => {
  searchItem = req.query.searchItem;
  searchItem = searchItem.toUpperCase();
  var totalCalories = 0;
  var carbs = 0;
  var fats = 0;
  var protein = 0;
  var message = "";
  foodDataModel.find({ Category: searchItem }, (err, items) => {
    if (err) {
      console.log(err);
    }
    if (items) {
      resData = items;
      res.json({ data: resData });
    } else {
      message = message + "Item Not Found";
      res.json({ data: message });
    }
  });
});

app.get("/apiv1/getHistory", async (req, res) => {
  date = req.query.date;
  userID = req.query.userId;
  console.log("User ID is " + userID);
  foodLogModel.findOne({ "Data.UserID": userID }, (err, foodLog) => {
    if (err) {
      console.log(err);
    }
    if (foodLog) {
      let foodlogArray = foodLog.Data.FoodData;
      let userDayLog = foodlogArray.filter((log) => {
        return log.Date === date;
      });
      if (userDayLog) {
        res.json({ data: userDayLog[0] });
      } else {
        res.json({ data: "History Not Found" });
      }
    } else {
      res.json({ data: "User History Not Found" });
    }
  });
});

app.get("/apiv1/getRecipe", async (req, res) => {
  userID = req.query.userId;
  recipeModel.findOne({ UserID: userID }, (err, recipes) => {
    if (err) {
      console.log(err);
    }
    if (recipes) {
      res.json({ data: recipes.recipeList });
    } else {
      res.json({ data: "Recipes not found for user" });
    }
  });
});

app.get("/apiv1/graph", async (req, res) => {
  userID = req.query.userId;
  const DateObj = new Date();
  let month = ("0" + (DateObj.getMonth() + 1)).slice(-2);
  let year = DateObj.getFullYear();
  var resData = [1950, 2000, 2235, 1660, 3200, 1890, 1900];
  res.json({ data: resData });
});

app.listen(port, () => {
  console.log("Node.js Server is Running");
});
