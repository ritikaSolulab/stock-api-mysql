"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  connectDb: () => connectDb,
  db: () => db
});
module.exports = __toCommonJS(src_exports);
var import_express2 = __toESM(require("express"));
var import_dotenv = __toESM(require("dotenv"));
var import_cors = __toESM(require("cors"));
var import_mysql = __toESM(require("mysql"));
var import_node_cron = __toESM(require("node-cron"));

// src/controllers/stock.ts
var import_lodash2 = __toESM(require("lodash"));

// src/logger.ts
var import_winston = __toESM(require("winston"));
var options = {
  file: {
    level: "info",
    filename: "./logs/app.log",
    handleExceptions: true,
    json: true,
    maxsize: 5242880,
    // 5MB
    maxFiles: 5,
    colorize: false
  },
  console: {
    level: "debug",
    handleExceptions: true,
    json: false,
    colorize: true
  }
};
var logger = import_winston.default.createLogger({
  levels: import_winston.default.config.npm.levels,
  transports: [
    new import_winston.default.transports.File(options.file),
    new import_winston.default.transports.Console(options.console)
  ],
  exitOnError: false
});

// src/lib/stock_wrapper.ts
var import_axios = __toESM(require("axios"));
var import_lodash = __toESM(require("lodash"));
var getDailyStock = async (symbol) => {
  const response = await import_axios.default.get(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${symbol}&apikey=${process.env.API_KEY}`);
  const dailyData = response.data["Time Series (Daily)"];
  if (import_lodash.default.isEmpty(dailyData) || import_lodash.default.isUndefined(dailyData) || import_lodash.default.isNull(dailyData)) {
    return "Nodata";
  }
  const filteredData = Object.keys(dailyData).slice(0, 7);
  const stockDetails = filteredData.map((date) => ({ date, ...dailyData[date] }));
  return stockDetails;
};
var getSymbol = async (keywords) => {
  const response = await import_axios.default.get(`https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${keywords}&apikey=${process.env.API_KEY}`);
  const data = response.data;
  if (import_lodash.default.isEmpty(data) || import_lodash.default.isUndefined(data) || import_lodash.default.isNull(data)) {
    return "Nodata";
  }
  return data;
};

// src/controllers/stock.ts
var stockApi = async (req, res) => {
  logger.info("Inside stock api");
  try {
    const { symbol } = req.query;
    if (typeof symbol === "string") {
      if (!isValidSymbol(symbol.toUpperCase())) {
        return res.status(400).json({
          message: "Invalid symbol"
        });
      }
      const findStock = `SELECT * FROM STOCK WHERE SYMBOL='${symbol}'`;
      db.query(findStock, async (error3, rows) => {
        if (error3)
          return res.status(400).json({ message: error3.message });
        if (rows.length)
          return res.status(200).json(rows[0].stockDetails);
        else {
          const stocks = await getDailyStock(symbol.toUpperCase());
          if (stocks === "Nodata")
            return res.status(404).json({ message: "This symbol has no data" });
          const saveUser = `INSERT INTO HISTORY (stockDetails,symbol) VALUES (?,?)`;
          db.query(saveUser, [JSON.stringify(stocks), symbol]);
          const stockData = `INSERT INTO STOCK (symbol,stockDetails) VALUES (?,?)`;
          db.query(stockData, [symbol, JSON.stringify(stocks)], (error4) => {
            if (error4)
              return res.status(400).json({ message: error4.message });
            else
              return res.status(200).json({
                success: true,
                message: "Successfully fetch the data"
              });
          });
        }
      });
    }
  } catch (error3) {
    console.error(error3);
    return res.status(500).json({ error: "Server error" });
  }
};
var historicalData = async () => {
  logger.info("Inside historical data");
  try {
    const updateStocks = `SELECT * FROM STOCK`;
    db.query(updateStocks, async (error3, rows) => {
      for (let i = 0; i < rows.length; i++) {
        let stockSymbol = rows[i].symbol;
        const last7Days = await getDailyStock(stockSymbol);
        const stockss = JSON.stringify(last7Days);
        console.log(stockss);
        const updateQuery = `UPDATE STOCK SET stockDetails='${stockss}' WHERE SYMBOL='${stockSymbol}'`;
        db.query(updateQuery, (error4) => {
          if (error4)
            console.log(error4.message);
        });
      }
    });
  } catch (error3) {
    console.error(error3);
  }
};
var isValidSymbol = (symbol) => {
  const pattern = /^[A-Z0-9.]{1,10}$/;
  return pattern.test(symbol);
};
var getSymbolData = async (req, res) => {
  try {
    const { keywords } = req.query;
    if (import_lodash2.default.isEmpty(keywords)) {
      return res.status(400).json({
        success: false,
        message: "Something you are missing"
      });
    }
    const symbols = await getSymbol(keywords);
    if (keywords === "Nodata")
      return res.status(404).json({
        message: "This symbol has no data"
      });
    return res.status(200).send(symbols);
  } catch (error3) {
    console.error(error3);
    return res.status(500).json({ error: "Server error" });
  }
};

// src/httpLogger.ts
var import_morgan = __toESM(require("morgan"));
var import_morgan_json = __toESM(require("morgan-json"));
var format = (0, import_morgan_json.default)({
  method: ":method",
  url: ":url",
  status: ":status",
  contentLength: ":res[content-length]",
  responseTime: ":response-time"
});
var httpLogger = (0, import_morgan.default)(format, {
  stream: {
    write: (message) => {
      const {
        method,
        url,
        status,
        contentLength,
        responseTime
      } = JSON.parse(message);
      logger.info("HTTP Access Log", {
        timestamp: (/* @__PURE__ */ new Date()).toString(),
        method,
        url,
        status: Number(status),
        contentLength,
        responseTime: Number(responseTime)
      });
    }
  }
});

// src/routes/router.ts
var import_express = __toESM(require("express"));

// src/controllers/auth/register.ts
var import_nodemailer = __toESM(require("nodemailer"));
var import_winston2 = require("winston");
var import_jsonwebtoken = __toESM(require("jsonwebtoken"));
var import_bcrypt = __toESM(require("bcrypt"));
var import_validator = __toESM(require("validator"));
var import_lodash3 = __toESM(require("lodash"));
var SECRET_TOKEN = "Ritika123";
var register = async (req, res) => {
  logger.info("Inside register");
  try {
    const { email, password } = req.body;
    if (import_lodash3.default.isEmpty(email) || import_lodash3.default.isEmpty(password)) {
      logger.error(`Provide all the details: ${import_winston2.error.message}`);
      return res.status(400).json({
        success: false,
        message: "Provide all the details"
      });
    }
    if (!import_validator.default.isEmail(email)) {
      return res.status(400).json({ message: "Invalid email" });
    }
    const findQuery = `SELECT * FROM USER WHERE EMAIL='${email}'`;
    db.query(findQuery, async (error3, rows) => {
      if (error3) {
        return res.status(400).json({ message: error3.message });
      } else {
        if (rows.length)
          return res.status(409).json({ message: "email already exist" });
        else {
          const salt = import_bcrypt.default.genSaltSync(10);
          const hash = import_bcrypt.default.hashSync(password, salt);
          await sendOTPVerificationEmail(email);
          const saveUser = `INSERT INTO USER (email,password) VALUES (?,?)`;
          db.query(saveUser, [email, hash], (error4) => {
            if (error4)
              return res.status(400).json({ message: error4.message });
            else
              return res.status(202).json({ status: "PENDING", message: "Verification otp email sent" });
          });
        }
      }
    });
  } catch (err) {
    console.log(err);
    return res.status(400).json("Server error");
  }
};
var sendOTPVerificationEmail = async (email) => {
  logger.info("Inside OTP Verification");
  try {
    const otp = `${Math.floor(1e3 + Math.random() * 9e3)}`;
    const transporter = import_nodemailer.default.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: {
        user: "freddy.jacobi@ethereal.email",
        pass: "8xrqNUHbDJK9trfK61"
      }
    });
    let message = {
      from: "freddy.jacobi@ethereal.email",
      to: email,
      subject: "Verify your email",
      text: `<p>Enter <b> ${otp}</b></p><p>This code <b>expires in 5 min</b>.</p>`
    };
    const saveOtp = `INSERT INTO userotpverification (email,otp,expiresAt) VALUES (?,?,?)`;
    db.query(saveOtp, [email, otp, Date.now() + 1e3 * 60 * 5]);
    await transporter.sendMail(message);
  } catch (err) {
    console.log(err);
  }
};
var verifyOTP = async (req, res) => {
  logger.info("Inside verifyOTP");
  try {
    let { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Provide valid details" });
    }
    if (!import_validator.default.isEmail(email)) {
      return res.status(400).json({ message: "Invalid email" });
    }
    const UserOTPVerificationRecords = `SELECT * FROM USEROTPVERIFICATION WHERE EMAIL='${email}'`;
    db.query(UserOTPVerificationRecords, async (error3, rows) => {
      if (error3)
        return res.status(400).json({ message: error3.message });
      if (!rows.length)
        return res.status(400).json({ message: "User has not registered" });
      const dbOTP = rows[rows.length - 1].otp;
      const dbExpires = rows[rows.length - 1].expiresAt;
      console.log(dbOTP);
      console.log(dbExpires);
      if (dbOTP != otp || dbExpires < Date.now()) {
        return res.status(401).json({ message: "code has expired. Please request again" });
      }
      const bearerToken = import_jsonwebtoken.default.sign(
        {
          email
        },
        SECRET_TOKEN,
        {
          expiresIn: "5h"
        }
      );
      logger.info("Access successfully generated");
      const updateQuery = `UPDATE USER SET isVerified='1' WHERE EMAIL='${email}'`;
      db.query(updateQuery, (error4) => {
        if (error4)
          return res.status(400).json({ message: error4.message });
        else {
          const deleteQuery = `DELETE FROM USEROTPVERIFICATION WHERE EMAIL='${email}'`;
          db.query(deleteQuery, (error5) => {
            if (error5)
              return res.status(400).json({ message: error5.message });
            return res.status(201).json({
              status: "VERIFIED",
              message: "Your otp has been verified",
              bearerToken
            });
          });
        }
      });
    });
  } catch (err) {
    console.log(err);
    return res.status(400).json("Server Error");
  }
};

// src/utils/verifyToken.ts
var import_jsonwebtoken2 = __toESM(require("jsonwebtoken"));
var import_winston3 = require("winston");
var SECRET_TOKEN2 = "Ritika123";
var verifyToken = async (req, res, next) => {
  logger.info("Inside verifyToken");
  try {
    let token;
    let authHeader = req.headers.Authorization || req.headers.authorization;
    if (Array.isArray(authHeader)) {
      authHeader = authHeader.join(",");
    }
    if (authHeader && authHeader.startsWith("Bearer")) {
      token = authHeader.split(" ")[1];
      import_jsonwebtoken2.default.verify(token, SECRET_TOKEN2, (err, decoded) => {
        if (err) {
          console.log(err);
          logger.error("User is not authorized");
          return res.status(401).json({
            message: "User is not authorized"
          });
        } else {
          req.user = decoded;
          next();
        }
      });
    } else {
      logger.error("User is not authorized or token is missing in the header");
      return res.status(401).json({ message: "User is not authorized or token is missing in the header" });
    }
  } catch (err) {
    logger.error(`Error in verifyToken: ${import_winston3.error.message}`);
    return res.status(400).json({ message: "server error" });
  }
};
var verificationOtp = async (req, res, next) => {
  logger.info("Inside verificationOTP");
  const user = `SELECT * FROM USER WHERE EMAIL='${req.user.email}'`;
  db.query(user, (error3, rows) => {
    if (error3)
      return res.status(400).json({ message: error3.message });
    if (!rows.length)
      return res.status(401).json({ message: "User is not valid" });
    verifyToken(req, res, () => {
      if (rows[0].isVerified == "1") {
        next();
      } else {
        return res.status(403).json({ message: "You are not verified!" });
      }
    });
  });
};

// src/routes/router.ts
var router = import_express.default.Router();
router.post("/api/v1/auth/register", register);
router.post("/api/v1/verifyOTP", verifyOTP);
router.get("/api/v1/stockPrice", verifyToken, verificationOtp, stockApi);
router.get("/api/v1/get-symbol", getSymbolData);

// src/index.ts
var app = (0, import_express2.default)();
import_dotenv.default.config();
var db = import_mysql.default.createConnection({
  //connectionLimit: 100,
  host: "localhost",
  //127.0.0.1
  user: "root",
  password: "Admin123@",
  database: "stock_api"
  //port: 3306
});
var connectDb = () => {
  db.connect((error3) => {
    if (error3) {
      console.log(error3);
    } else {
      console.log("Database connected!");
    }
  });
};
app.use((0, import_cors.default)());
app.use(import_express2.default.json());
app.use(httpLogger);
app.use(router);
import_node_cron.default.schedule("* * * * * *", async () => {
  await historicalData();
});
var port = 3e3;
app.listen(port || 5e3, () => {
  connectDb();
  console.log(`node server.js ${port}`);
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  connectDb,
  db
});
