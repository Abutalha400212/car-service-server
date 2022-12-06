const express = require("express");
const cors = require("cors");
const jwtToken = require('jsonwebtoken')
const colors = require("colors");
const port = process.env.PORT || 5000;
const app = express();
require('dotenv').config()
app.use(cors());
app.use(express.json());
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri =
  `mongodb+srv://${process.env.USER}:${process.env.USER_PASSWORD}@cluster0.xddzsoq.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
function verifyJwt(req,res,next){
const authHeader =  req.headers.authorization
if(!authHeader){
  return res.status(401).send({message: 'Unauthorized Access'})
}
const token = authHeader.split(' ')[1]
jwtToken.verify(token, process.env.JWT_ACCESS_TOKEN, function(err,decoded){
  if(err){
    return res.status(401).send({message: 'Unauthorized Access'})
  }
  req.decoded = decoded
  next()
})
}


async function dbRun() {
  try {
    await client.connect();
    console.log("MongoDb Connected".bgYellow);
  } catch (error) {
    console.log(error);
  }
}

dbRun();
const services = client.db("carsService").collection("service");
const orders = client.db("carsService").collection("orders");

app.get("/service", async (req, res) => {
  try {
    const serviceItem = services.find({});
    const data = await serviceItem.toArray();
    res.send(data);
  } catch (error) {
    console.log(error);
  }
});
app.get("/orders",verifyJwt, async (req, res) => {
  try {
const decoded = req.decoded
if(decoded.email !== req.query.email){
  res.status(403).send({message: 'Unauthorized Access'})
}

    let query = {};
    if (req.query.email) {
      query = {
        email: req.query.email,
      };
    }
    const serviceItem = orders.find(query);
    const data = await serviceItem.toArray();
    res.send({
      success: true,
      data: data
    })
  } catch (error) {
    res.send({
      success: false,
      error: error.message
    });
  }
});
app.post('/jwt',async (req,res)=>{
  const user = req.body
  console.log(user);
  const token = jwtToken.sign(user, process.env.JWT_ACCESS_TOKEN , {expiresIn: '5'})
  res.send({token})
  
})
app.patch('/orders/:id',async (req,res)=>{
  const {id} = req.params
const status = req.body.status
  try {
const updateStatus = {
  $set: {
    status:status
  }
}
    const result = await orders.updateOne({_id:ObjectId(id)},updateStatus)
    if(result.matchedCount){
      res.send({
        success:true,
        message:'Approved by authority'
      })
    }
    else{
      res.send({
        success: false,
        error: 'Did not Approve please wait sometimes'
      })
    }
  } catch (error) {
    console.log(error);
  }
})










app.delete('/orders/:id',async (req,res)=>{
  const {id} = req.params
  try { 
    const deleteItem = await orders.deleteOne({_id:ObjectId(id)})
   
  if(deleteItem.deletedCount){
    res.send({
      success:true,
      message:`Delete order`
    })
  }
  else{
  }
  } catch (error) {
    console.log(error);
  }
})

app.get("/orders/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const selected = await orders.findOne({ _id: ObjectId(id) });
    res.send({
      success: true,
      data: selected,
    });
  } catch (error) {
    res.send({
      success: false,
      error: error.message,
    });
  }
});
app.get("/service/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const selected = await services.findOne({ _id: ObjectId(id) });
    res.send({
      success: true,
      data: selected,
    });
  } catch (error) {
    res.send({
      success: false,
      error: error.message,
    });
  }
});

app.post("/orders", async (req, res) => {
  try {
    const order = await orders.insertOne(req.body);
    if (order.insertedId) {
      res.send({
        success: true,
        message: `Order recieved on serviceid ${order.insertedId}`,
      });
    } else {
      res.send({
        success: false,
        error: "Something error! please try again. ",
      });
    }
  } catch (error) {
    res.send({
      success: false,
      error: error.message,
    });
  }
});

app.get("/", (req, res) => {
  res.send("Car Service server in running");
});
app.listen(port, () =>
  console.log(`Car service server runnin on ${port}`.blue.bold)
);
