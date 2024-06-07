const express= require ('express');
const app= express();
require('dotenv').config()
const cors= require('cors');
const port = process.env.PORT ||5000;


//middleware

const corsOptions = {
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    // credentials: true,
    // optionSuccessStatus: 200,
  }
app.use(cors(corsOptions));
app.use(express.json());




const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kowhoxx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {

     
  try {

    const bloodRequestCollection= client.db('bloodLife').collection('bloodRequest');

    const usersCollection = client.db('bloodLife').collection('users');


    //save a user

    app.put('/user', async(req,res)=>{

      const user =req.body;
      const options = {upsert: true};
      const query = {email: user?.email};
      const updateDoc = {
        $set: {
          ...user
        }
      }

      const result = await usersCollection.updateOne(query,updateDoc,options);
      res.send(result);

    })
    //get all users
  app.get('/user', async(req,res)=>{
    const result = await usersCollection.find().toArray();
    res.send(result);
  })

  //get user by email 
  app.get('/user/:email', async(req,res)=>{
    const email = req.params.email;
    const result = await usersCollection.findOne({email});
    res.send(result);
  })

  //upate user role
  app.put('/api/users/:id/role', (req, res) => {
    const userId = new ObjectId(req.params.id);
    const { role } = req.body;

    usersCollection.updateOne({ _id: userId }, { $set: { role } }, (err, result) => {
        if (err) return res.status(500).send(err);
        if (result.matchedCount === 0) return res.status(404).send('User not found');
        res.send({ success: true });
    });
});


//all blood request

app.get('/blood', async(req,res)=>{
  const result = await bloodRequestCollection.find().toArray();
  res.send(result);
})

//update user status

app.put('/api/users/:id/status', (req, res) => {
  const userId = new ObjectId(req.params.id);
  const { status } = req.body;

  usersCollection.updateOne({ _id: userId }, { $set: { status } }, (err, result) => {
      if (err) return res.status(500).send(err);
      if (result.matchedCount === 0) return res.status(404).send('User not found');
      res.send({ success: true });
  });
});
    //createDonationform data save
    
    app.post('/blood', async(req,res)=>{
      const bloodData= req.body;
      const result = await bloodRequestCollection.insertOne(bloodData);
      res.send(result);
    })
  
    //find blood request by id
   app.get('/blood/:id', async(req,res)=>{
    const id = req.params.id;
    
    const query = {_id: new ObjectId(id)}
    const result = await bloodRequestCollection.findOne(query);
    res.send(result);
   })  
    
   //update blood request

   app.patch('/blood/:id', async(req,res)=>{
    const item = req.body;
    const id = req.params.id;
    const filter= {_id: new ObjectId(id)}
    const updateDoc= {
      $set:{
        recipientName: item.recipientName,
      district:item.district ,
      upazila: item.upazila,
      hospital: item.hospital,
      date:item.date,
      time:item.time,
        address:item.address, 
        message:item.message

      }
    }
    const result = await bloodRequestCollection.updateOne(filter, updateDoc)
    res.send(result)
   })


   //get pending data 

   app.get('/api/donate/pending', async (req, res) => {
    try {
      
      const pendingRequests = await bloodRequestCollection.find({ status: 'pending' }).toArray();
      res.json(pendingRequests);
    } catch (error) {
      console.error('Error fetching pending donation requests:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });


  // get all data by speceific email
  app.get('/my-donation/:email', async (req, res) => {
    const email = req.params.email;
    const query = { 
      requesterEmail: email };

    // console.log('Received email:', email);  // Log received email

    try {
        const result = await bloodRequestCollection.find(query).toArray();
        // console.log('Query result:', result);  // Log query result

        if (result.length === 0) {
            console.warn('No donations found for email:', email);
        }
        
        res.send(result);
    } catch (error) {
        console.error('Error fetching donations:', error);
        res.status(500).send({ error: 'An error occurred while fetching donations' });
    }
});

// get data 3 speceice email

app.get('/my-donation-limit/:email', async (req, res) => {
  const email = req.params.email;
  const query = { requesterEmail: email };

  // console.log('Received email:', email);  // Log received email

  try {
      const result = await bloodRequestCollection
          .find(query)
          .sort({ createdAt: -1 })  // Sort by createdAt in descending order
          .limit(3)  // Limit to the latest 3 entries
          .toArray();

      console.log('Query result:', result);  // Log query result

      // if (result.length === 0) {
      //     console.warn('No donations found for email:', email);
      // }
      
      res.send(result);
  } catch (error) {
      // console.error('Error fetching donations:', error);
      res.status(500).send({ error: 'An error occurred while fetching donations' });
  }
});

//delete bloodData


app.delete('/my-donation/:id', async (req, res) => {
    const id = req.params.id;
    
    const query = {_id: new ObjectId(id)}
     const result = await bloodRequestCollection.deleteOne(query);
     res.send(result);
      
});

//update blood request status

app.put('/donation-requests/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await bloodRequestCollection.updateOne({ _id: new ObjectId(id) }, { $set: { status } });
    const updatedRequest = await bloodRequestCollection.findOne({ _id: new ObjectId(id) });
    res.json(updatedRequest);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// update blood request by inprogreess to done or canceled





    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req,res)=>{
    res.send('blood for life')
})

app.listen(port, ()=>{
    console.log(`blood for life is setting on ${port}`);
})