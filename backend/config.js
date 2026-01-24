/*
This file is here to store the secret once. Usually this should be in .env but we do it here. 
*/

export const config = {
  JWT_SECRET: process.env.JWT_SECRET ?? 'MealMover',
};
