import { Response } from "express";
import lodash from "lodash";
import { logger } from "../logger";
import { getDailyStock, getSymbol } from "../lib/stock_wrapper";
import { Request } from "../types";
import { db } from "../index";

//function to find the stock price from the database from particular symbol
export const stockApi = async (req: Request, res: Response) => {
  logger.info("Inside stock api");
  try {
    const { symbol } = req.query;
    if (typeof symbol === "string") {
      if (!isValidSymbol(symbol.toUpperCase())) {
        return res.status(400).json({
          message: "Invalid symbol",
        });
      }
      const findStock = `SELECT * FROM STOCK WHERE SYMBOL='${symbol}'`
      db.query(findStock, async (error,rows) => {
        if (error) return res.status(400).json({ message: error.message })
        if(rows.length) return res.status(200).json(rows[0].stockDetails)
        else {
          const stocks = await getDailyStock(symbol.toUpperCase());
          if (stocks === "Nodata") return res.status(404).json({ message: "This symbol has no data" })
          const saveUser = `INSERT INTO HISTORY (stockDetails,symbol) VALUES (?,?)`
          db.query(saveUser,[JSON.stringify(stocks),symbol])
          const stockData = `INSERT INTO STOCK (symbol,stockDetails) VALUES (?,?)`
          db.query(stockData, [symbol, JSON.stringify(stocks)], (error) => {
            if (error) return res.status(400).json({ message: error.message })
            else
              return res
                .status(200)
                .json({
                  success: true,
                  message: "Successfully fetch the data",
                });
          });
        }
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
};

export const historicalData = async () => {
  logger.info("Inside historical data");
  try {
    const updateStocks = `SELECT * FROM STOCK`;
    db.query(updateStocks, async (error, rows) => {
      for (let i = 0; i<rows.length; i++) {
        let stockSymbol = rows[i].symbol
        const last7Days = await getDailyStock(stockSymbol as string)
        const stockss = JSON.stringify(last7Days)
        console.log(stockss)
        const updateQuery = `UPDATE STOCK SET stockDetails='${stockss}' WHERE SYMBOL='${stockSymbol}'`
        db.query(updateQuery, (error) => {
          if (error) console.log(error.message);
        })
      }
    });
  } catch (error) {
    console.error(error);
  }
};

export const isValidSymbol = (symbol: string): Boolean => {
  const pattern = /^[A-Z0-9.]{1,10}$/;
  return pattern.test(symbol);
};

export const getSymbolData = async (req: Request, res: Response) => {
  try {
    const { keywords } = req.query;
    if (lodash.isEmpty(keywords)) {
      return res.status(400).json({
        success: false,
        message: "Something you are missing",
      });
    }
    const symbols = await getSymbol(keywords as string);
    if (keywords === "Nodata")
      return res.status(404).json({
        message: "This symbol has no data",
      });
    return res.status(200).send(symbols);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
};
