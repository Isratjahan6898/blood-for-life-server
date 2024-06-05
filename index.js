const express= require('express');
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


    //createDonationform data save
    
    app.post('/blood', async(req,res)=>{
      const bloodData= req.body;
      const result = await bloodRequestCollection.insertOne(bloodData);
      res.send(result);
    })

   app.get('/blood/:id', async(req,res)=>{
    const id = req.params.id;
    
    const query = {_id: new ObjectId(id)}
    const result = await bloodRequestCollection.findOne(query);
    res.send(result);
   })  




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