import axios from "axios";
import lodash from "lodash";

// fetch stock price based on symbol
export const getDailyStock = async(symbol:string) => {
    const response = await axios.get(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${symbol}&apikey=${process.env.API_KEY}`);
      
    const dailyData = response.data['Time Series (Daily)']
    if(lodash.isEmpty(dailyData) || lodash.isUndefined(dailyData) || lodash.isNull(dailyData)){
      return 'Nodata'
    }
    const filteredData = Object.keys(dailyData).slice(0,7)

    const stockDetails = filteredData.map((date:any)=>({date, ...dailyData[date]}))

    return stockDetails;
  
}

export const getSymbol = async(keywords:string) => {
  const response = await axios.get(`https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${keywords}&apikey=${process.env.API_KEY}`);
  
  const data = response.data
  if(lodash.isEmpty(data) || lodash.isUndefined(data) || lodash.isNull(data)){
    return 'Nodata'
  }

  return data;

}
    