require("dotenv").config();
const express = require("express")
const cors = require("cors")
const connectDB = require("./src/config/database");
const cookieParser = require("cookie-parser");
const http = require("http");
const {WebSocketServer} = require("ws");
const { notifyDisconnect, forwardMessageToRAG } = require("./src/rag/ragService");

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({server});

const PORT = process.env.PORT

app.use(cors()); 
app.use(express.json()); //every json that comes from frontend will be converted to js object. this function will work on every route.
app.use(cookieParser());

const authRouter = require("./src/routes/auth");

app.use("",authRouter);

wss.on("connection", async(ws)=>{
    
/*
    try{
        await notifyStatus("on");
        console.log("flutter connected.");
        ws.send(JSON.stringify({ 
            type: "connected", 
            msg: "WS connection established" , 
            ragOnline:true
        }));
    }catch(err){
        console.error("Failed to connect rag service.\n"+ err.message);
        ws.send(JSON.stringify({
            type:"connected",
            msg:"ws connection established but couldn't connect to rag service",
            ragOnline:false
        }));
    }
 */   
    

    

    ws.on("message", async (data) => {
    const message = data.toString();
    console.log("Message from Flutter:", message);

    // Forward to RAG service
    try {
        const ragResponse = await forwardMessageToRAG(message);
        ws.send(JSON.stringify({
      type: "ragResponse",
      data: ragResponse.response,
      status:"success"
    }));
    } catch (err) {
        console.error("Failed to transfer message.\n"+err.message);
        ws.send(JSON.stringify({
            type:"ragResponse",
            status:"failed"
        }))
    }
    

    // Send RAG response back to Flutter
    
    });

    ws.on("close", async () => {
    console.log("Flutter disconnected");

    // Tell RAG that the user is offline
    try {
        await notifyDisconnect();
        console.log("flutter disconnected.");
    } catch (err) {
        console.error("Failed to notify rag service.\n"+err.message);
    }
    
    });


});

connectDB()
    .then(()=>{
        console.log("DB connection established.");
        server.listen(PORT,()=>{
        const HOST = "localhost"; 
        console.log(`🚀 Server is running at: http://${HOST}:${PORT}`);
        });
    })
    .catch((err)=>{
        console.error(`couldn't connect to the database :( :\n ${err.message}`);
    })