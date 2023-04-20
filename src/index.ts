import express from 'express';
const app = express();
import dotenv from "dotenv";
import cors from "cors";
import mysql from 'mysql'
import cron from 'node-cron'; 
import { historicalData } from './controllers/stock';
import {httpLogger} from './httpLogger'
import {router} from './routes/router';

dotenv.config();

export const db = mysql.createConnection({
    //connectionLimit: 100,
    host: "localhost",       //127.0.0.1
    user: "root",         
    password: "Admin123@",  
    database: "stock_api",
    //port: 3306
})  

export const connectDb = () => {
    db.connect((error)=>{
        if(error){
            console.log(error);
        } else {
            console.log('Database connected!');
        }
    });
}


app.use(cors());
app.use(express.json());
app.use(httpLogger)

//router 
app.use(router);

cron.schedule("0 8 * * *", async() => {
    await historicalData();
})

const port = 3000
app.listen(port || 5000, () => {
    connectDb()
    console.log(`node server.js ${port}`);
});



