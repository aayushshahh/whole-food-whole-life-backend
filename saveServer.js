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

app.get("/", async (req, res) => {
  res.sendStatus(200);
});

app.post("/apiv1/saveUser", async (req, res) => {
  var UserID = req.body.userId;
  var Password = req.body.password;
  var Name = req.body.name;
  var Age = parseInt(req.body.age);
  var Sex = req.body.sex;
  var Location = req.body.location;
  var Height = parseInt(req.body.height);
  var Weight = parseInt(req.body.weight);
  var GoalWeight = parseInt(req.body.goal);
  var maintainCalorie = 0;
  if (Sex == "Male" || Sex == "M") {
    maintainCalorie = (10 * Weight + 6.25 * Height - 5 * Age + 5) * 1.85;
  } else if (Sex == "Female" || Sex == "F") {
    maintainCalorie = (10 * Weight + 6.25 * Height - 5 * Age - 161) * 1.85;
  }
  var calorieGoal = 0;
  console.log(maintainCalorie);
  if (GoalWeight > Weight) {
    calorieGoal = maintainCalorie + 500;
  } else if (GoalWeight < Weight) {
    calorieGoal = maintainCalorie - 500;
  }
  console.log(calorieGoal);
  var user = {
    UserID: UserID,
    Password: Password,
    Name: Name,
    Age: Age,
    Sex: Sex,
    Location: Location,
    Height: Height,
    Weight: Weight,
    GoalWeight: GoalWeight,
    DailyCalorieGoal: calorieGoal,
  };
  const userData = new userModel(user);
  try {
    await userData.save();
    res.json({ Message: "User Added Successfully", UserId: UserID });
  } catch (error) {
    console.log(error);
    res.json({ Message: "User not added, error found", Error: error });
  }
});

app.post("/apiv1/trackMeal", async (req, res) => {
  var UserID = req.body.userId;
  var FoodItem = req.body.foodItem;
  var Calories = parseInt(req.body.calories);
  var Carbs = parseInt(req.body.carbs);
  var Fats = parseInt(req.body.fats);
  var Protein = parseInt(req.body.protein);
  var MealTime = req.body.mealTime;
  console.log(req.body);
  console.log(UserID);
  console.log(FoodItem);
  console.log(Calories);
  console.log(Carbs);
  console.log(Fats);
  console.log(Protein);
  console.log(MealTime);
  const DateObj = new Date();
  let day = ("0" + DateObj.getDate()).slice(-2);
  let month = ("0" + (DateObj.getMonth() + 1)).slice(-2);
  let year = DateObj.getFullYear();
  let date = day + " " + month + " " + year;
  foodLogModel.findOne({ UserID: UserID }, (err, foodLog) => {
    if (err) {
      console.log(err);
    }
    if (foodLog) {
      var foodLogArray = foodLog.Data.FoodData;
      var userDayLog = foodLogArray.filter((log) => {
        return log.Date === date;
      });
      if (userDayLog.length > 0) {
        userDayLog[0].TotalCalories = userDayLog[0].TotalCalories + Calories;
        userDayLog[0].TotalCarbs = userDayLog[0].TotalCarbs + Carbs;
        userDayLog[0].TotalFats = userDayLog[0].TotalFats + Fats;
        userDayLog[0].TotalProtein = userDayLog[0].TotalProtein + Protein;
        var DetailFoodArray = userDayLog[0].Food[MealTime].Details;
        userDayLog[0].Food[MealTime].CalorieSum =
          userDayLog[0].Food[MealTime].CalorieSum + Calories;
        userDayLog[0].Food[MealTime].CarbSum =
          userDayLog[0].Food[MealTime].CarbSum + Carbs;
        userDayLog[0].Food[MealTime].FatSum =
          userDayLog[0].Food[MealTime].FatSum + Fats;
        userDayLog[0].Food[MealTime].ProteinSum =
          userDayLog[0].Food[MealTime].ProteinSum + Protein;
        var foodDetail = {
          FoodItem: FoodItem,
          Calories: Calories,
          Carbs: Carbs,
          Fats: Fats,
          Protein: Protein,
        };
        DetailFoodArray.push(foodDetail);
        userDayLog[0].Food[MealTime].Details = DetailFoodArray;
        var index = foodLog.Data.FoodData.findIndex((log) => log.Date === date);
        foodLog.Data.FoodData[index] = userDayLog[0];
        foodLogModel
          .findOneAndUpdate(
            { UserID: UserID },
            { Data: foodLog.Data },
            { new: true }
          )
          .then((newLog) => {
            var resData = {
              Message: "Update Successfull",
              Data: newLog,
            };
            res.json({ data: resData });
          })
          .catch((error) => {
            var resData = {
              Message: "Update Unsuccessful",
              Data: error,
            };
            res.json({ data: resData });
          });
      } else {
        var log = {
          Date: date,
          TotalCalories: Calories,
          TotalCarbs: Carbs,
          TotalFats: Fats,
          TotalProtein: Protein,
          WaterConsumption: 0,
          Food: {},
        };
        log.Food[MealTime] = {
          CalorieSum: Calories,
          CarbSum: Carbs,
          FatSum: Fats,
          ProteinSum: Protein,
          Details: [
            {
              FoodItem: FoodItem,
              Calories: Calories,
              Carbs: Carbs,
              Fats: Fats,
              Protein: Protein,
            },
          ],
        };
        foodLog.Data.FoodData.push(log);
        foodLogModel
          .findOneAndUpdate(
            { UserID: UserID },
            { Data: foodLog.Data },
            { new: true }
          )
          .then((log) => {
            var resData = {
              Message: "Update Successfull",
              Data: log,
            };
            res.json({ data: resData });
          })
          .catch((error) => {
            var resData = {
              Message: "Update Unsuccessful",
              Data: error,
            };
            res.json({ data: resData });
          });
      }
    } else {
      var newFoodLog = {
        Data: {
          UserID: UserID,
          FoodData: [
            {
              Date: date,
              TotalCalories: Calories,
              TotalCarbs: Carbs,
              TotalFats: Fats,
              TotalProtein: Protein,
              WaterConsumption: 0,
              Food: {},
            },
          ],
        },
      };
      var mealDeets = {
        CalorieSum: Calories,
        CarbSum: Carbs,
        FatSum: Fats,
        ProteinSum: Protein,
        Details: [
          {
            FoodItem: FoodItem,
            Calories: Calories,
            Carbs: Carbs,
            Fats: Fats,
            Protein: Protein,
          },
        ],
      };
      newFoodLog.Data.FoodData[0].Food[MealTime] = mealDeets;
      console.log(JSON.stringify(newFoodLog));
      var newFoodModel = new foodLogModel(newFoodLog);
      newFoodModel
        .save()
        .then((result) => {
          var resData = {
            Message: "New Record Added Successfully",
            Data: result,
          };
          res.json({ data: resData });
        })
        .catch((error) => {
          var resData = {
            Message: "Record not added, failure",
            Data: error,
          };
          res.json({ data: resData });
        });
    }
  });
});

app.post("/apiv1/trackWater", async (req, res) => {
  var userID = req.body.userId;
  var WaterConsumption = parseInt(req.body.water);
  const DateObj = new Date();
  let day = ("0" + DateObj.getDate()).slice(-2);
  let month = ("0" + (DateObj.getMonth() + 1)).slice(-2);
  let year = DateObj.getFullYear();
  let date = day + " " + month + " " + year;
  foodLogModel.findOne({ UserID: userID }, (err, foodLog) => {
    if (err) {
      console.log(err);
    }
    if (foodLog) {
      var foodLogArray = foodLog.Data.FoodData;
      var userDayLog = foodLogArray.filter((log) => {
        return log.Date === date;
      });
      if (userDayLog.length > 0) {
        userDayLog[0].WaterConsumption =
          userDayLog[0].WaterConsumption + WaterConsumption;
        var index = foodLog.Data.FoodData.findIndex((log) => log.Date === date);
        foodLog.Data.FoodData[index] = userDayLog[0];
        foodLogModel
          .findOneAndUpdate(
            { UserID: userID },
            { Data: foodLog.Data },
            { new: true }
          )
          .then((newLog) => {
            var resData = {
              Message: "Update Successfull",
              Data: newLog,
            };
            res.json({ data: resData });
          })
          .catch((error) => {
            var resData = {
              Message: "Update Unsuccessful",
              Data: error,
            };
            res.json({ data: resData });
          });
      } else {
        var newLog = {
          Date: date,
          TotalCalories: 0,
          TotalCarbs: 0,
          TotalFats: 0,
          TotalProtein: 0,
          WaterConsumption: WaterConsumption,
        };
        foodLog.Data.FoodData.push(newLog);
        foodLogModel
          .findOneAndUpdate(
            { UserID: userID },
            { Data: foodLog.Data },
            { new: true }
          )
          .then((log) => {
            var resData = {
              Message: "Update Successfull",
              Data: log,
            };
            res.json({ data: resData });
          })
          .catch((error) => {
            var resData = {
              Message: "Update Unsuccessful",
              Data: error,
            };
            res.json({ data: resData });
          });
      }
    } else {
      var newFoodLog = {
        Data: {
          UserID: userID,
          FoodData: [
            {
              Date: date,
              TotalCalories: 0,
              TotalCarbs: 0,
              TotalFats: 0,
              TotalProtein: 0,
              WaterConsumption: WaterConsumption,
            },
          ],
        },
      };
      var newFoodModel = new foodLogModel(newFoodLog);
      newFoodModel
        .save()
        .then((result) => {
          var resData = {
            Message: "New Record Added Successfully",
            Data: result,
          };
          res.json({ data: resData });
        })
        .catch((error) => {
          var resData = {
            Message: "Record not added, failure",
            Data: error,
          };
          res.json({ data: resData });
        });
    }
  });
});

app.listen(port, () => {
  console.log("Node.js Server is Running");
});
