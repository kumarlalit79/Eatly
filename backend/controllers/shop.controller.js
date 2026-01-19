import Item from "../models/item.model.js";
import Shop from "../models/shop.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";

export const createEditShop = async (req, res) => {
  console.log("USER ID =", req.userId);

  console.log("REQ FILE =", req.file);
  console.log("REQ BODY =", req.body);

  try {
    const { name, city, state, address } = req.body;

    // for image
    let image;
    if (req.file) {
      image = await uploadOnCloudinary(req.file.path);
    }

    // finding shop
    let shop = await Shop.findOne({ owner: req.userId });
    if (!shop) {
      // create
      shop = await Shop.create({
        name,
        city,
        state,
        address,
        image,
        owner: req.userId,
      });
    } else {
      // update
      shop = await Shop.findByIdAndUpdate(
        shop._id,
        {
          name,
          city,
          state,
          address,
          image,
          owner: req.userId,
        },
        { new: true }
      );
    }

    await shop.populate("owner items");
    return res.status(201).json(shop);
  } catch (error) {
    console.log("backend error", error);
    return res.status(500).json({
      message: `create shop error`,
      error: error.message,
    });
  }
};

// get own shop
export const getMyShop = async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.userId }).populate(
      "owner"
    ).populate({
      path:"items",
      options:{sort:{updatedAt:-1}}
    });
    if (!shop) {
      return null;
    }
    return res.status(200).json(shop);
  } catch (error) {
    return res.status(500).json({
      message: `Get my shop error ${error}`,
    });
  }
};

export const getShopByCity = async (req,res) => {
  try {
    const {city} = req.params

    const shops = await Shop.find({
      city : {$regex:new RegExp(`^${city}$`,"i")}
    }).populate("items")

    if (!shops) {
      return res.status(400).json({
        message : "Shops not found"
      })
    }
    return res.status(200).json(shops);
  } catch (error) {
    return res.status(500).json({
      message: `Get shop by city error ${error}`,
    });
  }
}

