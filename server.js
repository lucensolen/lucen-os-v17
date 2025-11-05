import express from 'express';
import cors from 'cors';
const app = express();
app.use(cors()); app.use(express.json());
const gates=[
  {name:'RootLine',toll:'free',description:'Resilience + lineage knowledge base'},
  {name:'Dara',toll:'£3/mo',description:'Earth gate — grounded creation'},
  {name:'Vara',toll:'£3/mo',description:'Sky gate — connective interface'}
];
app.get('/health',(_req,res)=>res.json({ok:true}));
app.get('/gates',(_req,res)=>res.json(gates));
const port=process.env.PORT||8081;
app.listen(port,()=>console.log('Lucen API running on',port));
