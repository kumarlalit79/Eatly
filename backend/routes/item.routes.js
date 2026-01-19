import express from "express";
import isAuth from "../middlewares/isAuth.js";
import { addItems , deleteItems, editItems, getItemByCity, getItemById, getItemsByShop, rating, searchItems } from "../controllers/items.controllers.js";
import { upload } from "../middlewares/multer.js";


const itemRouter = express.Router();

itemRouter.post("/add-item" , isAuth, upload.single("image") ,addItems);
itemRouter.post("/edit-item/:itemId" , isAuth, upload.single("image") , editItems);
itemRouter.get("/get-by-id/:itemId" , isAuth , getItemById);
itemRouter.get("/delete/:itemId" , isAuth , deleteItems);
itemRouter.get("/get-by-city/:city" , isAuth , getItemByCity);
itemRouter.get("/get-by-shop/:shopId" , isAuth , getItemsByShop);
itemRouter.get("/search-items" , isAuth , searchItems);
itemRouter.post("/rating" , isAuth , rating);

export default itemRouter;
