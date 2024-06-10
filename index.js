const express= require ('express');
const app= express();
var jwt = require('jsonwebtoken');
require('dotenv').config()
const stripe=require('stripe')(process.env.STRIPE_SECRET_KEY) 
const cors= require('cors');
const port = process.env.PORT ||5000;


//middleware

const corsOptions = {
    origin: ['http://localhost:5173', 
      'http://localhost:5174',
      'https://blood-donetion.web.app',
      'https://blood-donetion.firebaseapp.com'


         ],
    credentials:true
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
    const blogsCollection = client.db('bloodLife').collection('blogs');
    const paymentCollection = client.db('bloodLife').collection('payments');
    

  
    //verify admin

    const verifyAdmin = async(req,res, next)=>{
     const email = req.decoded.email;
     const query= {email:email};
      const user = await usersCollection.findOne(query)
    const isAdmin= user?.role ==='admin';
    if(!isAdmin){
      return res.status(403).send({message: 'forbidden access'});
    }

      next();
    } 

    //verify Vlountter

    const verifyVolunteer = async(req,res, next)=>{
      const email = req.decoded.email;
     const query= {email:email};
      const user = await usersCollection.findOne(query)
    const isVolunteer= user?.role ==='volunteer';
    if(!isVolunteer){
      return res.status(403).send({message: 'unauthorized access'});
    }

      next();
    } 

    //verifyToken
    const verifyToken = (req,res,next)=>{
      console.log('inside verify token',req.headers.authorization);

      if(!req.headers.authorization){
        return res.status(401).send({message:'unauthorizatin access'})
      }
      const token= req.headers.authorization.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=>{
        if(err){
          return res.status(401).send({message:'unauthorization access'})
        }
        req.decoded = decoded;
        next();
      })
    }


    //jwt related api

    app.post('/jwt', async(req,res)=>{
      const user = req.body;
      const token= jwt.sign(user, process.env.ACCESS_TOKEN_SECRET,{
        expiresIn:'3h'
      });
      res.send({token})
    })
   //get admin
    app.get('/user/admin/:email', verifyToken, async(req,res)=>{
      const email = req.params.email;
      if(email !==req.decoded.email){
        return res.status(403).send({message:'unauthorized access'})
      }
      const query= {email: email};
      const user = await usersCollection.findOne(query);
      let admin= true;
      if(user){
        admin= user?.role === 'admin';
      }
      res.send({admin})
    })

    //get volunteer

    app.get('/user/volunteer/:email', verifyToken, async(req,res)=>{
      const email = req.params.email;
      if(email !==req.decoded.email){
        return res.status(403).send({message:'unauthorized access'})
      }
      const query= {email: email};
      const user = await usersCollection.findOne(query);
      let volunteer= true;
      if(user){
        admin= user?.role === 'volunteer';
      }
      res.send({volunteer})
    })

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
//  app.put('/user/:email', async (req, res) => {
//     const { email } = req.params;
//     const userData = req.body; 

//     try {
//         const result = await usersCollection.updateOne(
//             { email: email },
//             { $set: userData }
//         );

//         if (result.modifiedCount === 0) {
//           return res.status(404).json({ message: 'User not found' });
//       }

//         res.send(result)

       

//         res.status(200).json({ message: 'User profile updated successfully' });
//     } catch (error) {
//         console.error('Error updating user profile:', error);
//         res.status(500).json({ message: 'Server error' });
//     }
// });

//upadte profele



app.put('/userss/:email', (req, res) => {
  const email = req.params.email;
  const updatedProfile = req.body; // Assuming the request body contains updated profile data
  const index = users.findIndex(user => user.email === email);
  if (index !== -1) {
      users[index] = { ...users[index], ...updatedProfile };
      res.status(200).json({ message: 'User profile updated successfully' });
  } else {
      res.status(404).json({ error: 'User not found' });
  }
});


//profile update

app.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const userData = req.body;

  try {
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(id) }, // Filter by user ID
      { $set: userData } // Update user data
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Send updated user data in response
    const updatedUser = await usersCollection.findOne({ _id: new ObjectId(id) });
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


//all blood request

app.get('/blood', async(req,res)=>{
  const result = await bloodRequestCollection.find().toArray();
  res.send(result);
})

//update user status

app.put('/api/users/:id/status', async(req, res) => {
  const userId = new ObjectId(req.params.id);
  const { status } = req.body;

 const result= await usersCollection.updateOne({ _id: userId }, { $set: { status } }, 
  );
  res.send({ success: true });
});

//user role change
app.put('/api/users/:userId/role', async (req, res) => {
  const userId = new ObjectId (req.params.userId);
  const { role } = req.body;

  
      const result = await usersCollection.updateOne(
          { _id: userId },
          { $set: { role: role } }
      );
      res.send(result);
      
 });


 //search user

 app.get('/api/donors', async (req, res) => {
  const { bloodGroup, district, upazila } = req.query;
  const query = {};
  if (bloodGroup) {
    query.bloodGroup = bloodGroup;
  }
  if (district) {
    query.district = district;
  }
  if (upazila) {
    query.upazila = upazila;
  }
  try {
    const donors = await usersCollection.find(query).toArray();
    res.json(donors);
  } catch (error) {
    console.error('Error fetching donors:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
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
  // try {
  //   const { id } = req.params;
  //   const { status } = req.body;
  //   await bloodRequestCollection.updateOne({ _id: new ObjectId(id) }, { $set: { status } });
  //   const updatedRequest = await bloodRequestCollection.findOne({ _id: new ObjectId(id) });
  //   res.json(updatedRequest);
  // } catch (err) {
  //   res.status(500).send(err.message);
  // }

  const userId = new ObjectId(req.params.id);
  const { status } = req.body;

 const result= await bloodRequestCollection.updateOne({ _id: userId }, { $set: { status } }, 
  );
  res.send({ success: true });
});

// update blood request by inprogreess to done or canceled



//blogs post
app.post('/blogs', async (req, res) => {
  const blogs = req.body;


 
    const result = await blogsCollection.insertOne(blogs);
    res.send(result);

});

//get all blog 

app.get('/blogs', async(req,res)=>{
  const result = await blogsCollection.find().toArray();
  res.send(result);
})

// delete blog 
app.delete('/blogs/:id', async (req, res) => {
  const id = req.params.id;
  
  const query = {_id: new ObjectId(id)}
   const result = await blogsCollection.deleteOne(query);
   res.send(result);
    
});


//update blog status

app.put('/blogs/:id/status',  async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['draft', 'published'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const result = await blogsCollection.updateOne({ _id: new ObjectId(id) }, { $set: { status } });
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    const updatedBlog = await blogsCollection.findOne({ _id: new ObjectId(id) });
    res.json(updatedBlog);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

//get publish blog
app.get('/api/blogs/publish', async (req, res) => {
  try {
    
    const blogsdata = await blogsCollection.find({ status: 'published' }).toArray();
    res.json(blogsdata);
  } catch (error) {
    console.error('Error fetching published blog:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


//payment intent
app.post('/create-paymet-intent', async(req,res)=>{
  const { price }= req.body;
  const amount = parseInt(price*100);
  // console.log(amount, 'inside amount');
  const paymentIntent= await stripe.paymentIntents.create({
    amount:amount,
    currency:'usd',
    payment_method_types:['card']
  });
  res.send({
    clientSecret: paymentIntent.client_secret
  })
})

app.post('/payment', async(req,res)=>{
  const payment = req.body;
  const paymentResult= await paymentCollection.insertOne(payment);
  console.log('payment info', payment);
  res.send(paymentResult)
})

//payment get

app.get('/payment', async(req,res)=>{
  const result = await paymentCollection.find().toArray();
  res.send(result);
})


    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
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