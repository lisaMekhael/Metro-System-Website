const { isEmpty } = require("lodash");
const { v4 } = require("uuid");
const db = require("../../connectors/db");
const roles = require("../../constants/roles");
const {getSessionToken}=require('../../utils/session')
const getUser = async function (req) { 
  const sessionToken = getSessionToken(req);
  if (!sessionToken) {
    return res.status(301).redirect("/");
  }

  const user = await db
    .select("*")
    .from("se_project.sessions")
    .where("token", sessionToken)
    .innerJoin(
      "se_project.users",
      "se_project.sessions.userId",
      "se_project.users.id"
    )
    .innerJoin(
      "se_project.roles",
      "se_project.users.roleId",
      "se_project.roles.id"
    )
    .first();

  console.log("user =>", user);
  user.isNormal = user.roleId === roles.user;
  user.isAdmin = user.roleId === roles.admin;
  user.isSenior = user.roleId === roles.senior;
  return user;
};


module.exports = function (app) {
  // example
  app.put("/users", async function (req, res) {
    try {
      const user = await getUser(req);
      const users = await db.select('*').from("se_project.users")
        
      return res.status(200).json(users);
    } catch (e) {
      console.log(e.message);
      return res.status(400).send("Could not get users");
    }
  });


  //reset password user
  app.put("/api/v1/password/reset", async function(req , res){
    const user = await getUser(req);
    const {newPassword} = req.body.newPassword;


    //????make sure that user isnot admin?????

    try{
      await db("se_project.users").where({ id: userId }).update({password:newPassword})
      return res.status(200).send("password changed!");

    } catch(e){
      console.log(e.message);
      return res.status(400).send("Could not change password");
    }


  });


  //get station-id  !!! this is not the id in sql table , this is a unique id extracted from the URL !!!
  const getstationID = app.get("/api/v1/station/:stationId",(req) => {
    return req.params.id;
  });


  //get station 
  const getStation = async function(req){
    const station = await db
    .select("*")
    .from("se_project.stations")
    .where("id", getstationID)

    return station;

  };

  //manage stations - update station
  app.put("/api/v1/station/:stationId" , async function(req){
    const user = await getUser(req);
    const stationN = req.body.stationN

    if(user.isAdmin===true){
      const updatedStation = await db("se_project.stations").where("id",getstationID).update("stationName" , stationN )
      return res.status(200).json(updatedStation)
    }else{
      return res.status(400).send("you are not an admin you cannot update stations");
    }

  });



}
