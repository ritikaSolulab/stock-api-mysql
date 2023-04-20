import { Request as ExpressRequest } from "express";


export interface Request extends ExpressRequest {
    token?: string;
    user?:any;
}

export interface alphavantageResponse {
    'Time Series (5min)': {
      [key: string]: {
        '1. open': string,
        '2. high': string,
        '3. low': string,
        '4. close': string,
      };
    };
  }