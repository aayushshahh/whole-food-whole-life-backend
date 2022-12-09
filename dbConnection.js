const mongoose = require("mongoose");
const fs = require("fs");
const schemaData = require("./databaseSchema");
const Constants = require("./Constants");

mongoose
  .connect(Constants.Url, Constants.ConnectionParams)
  .then(() => {
    console.log("Connection Successfull");
  })
  .catch((err) => {
    console.log("Error is");
    console.log(err);
  });

let foodDataModel = mongoose.model("foodDataModel", schemaData.foodDataSchema);

const foodFile = JSON.parse(fs.readFileSync("./users.json", "utf-8"));

const uploadFile = async () => {
  try {
    await foodDataModel.create(foodFile);
    console.log("Data Uploaded Successfully");
    process.exit();
  } catch (err) {
    console.log(err);
  }
};

uploadFile();
