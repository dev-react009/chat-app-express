
const isProduction = process.env.NODE_ENV  === "production";

export const log = (...args:any):void => {
  if (!isProduction) {
    console.log(...args);
  }
};

export const error = (...args:any[]):void => {
  if (!isProduction) {
    console.error(...args);
  }
};
