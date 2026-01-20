import DeliveryAssignment from "../models/deliveryAssignment.model.js";
import Order from "../models/oder.model.js";
import Shop from "../models/shop.model.js";
import User from "../models/user.model.js";
import { sendDeliveryOtpMail } from "../utils/mail.js";
import RazorPay from "razorpay";
import dotenv from "dotenv";
dotenv.config();

let instance = new RazorPay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const placeOrder = async (req, res) => {
  try {
    const { cartItems, paymentMethod, deliveryAddress, totalAmount } = req.body;

    if (!cartItems || cartItems.length == 0) {
      return res.status(400).json({
        message: "Cart is empty",
      });
    }

    if (
      !deliveryAddress.text ||
      !deliveryAddress.latitude ||
      !deliveryAddress.longitude
    ) {
      return res.status(400).json({
        message: "Send complete delivery address",
      });
    }

    const groupItemsByShop = {};

    cartItems.forEach((item) => {
      const shopId = item.shop;
      if (!groupItemsByShop[shopId]) {
        groupItemsByShop[shopId] = [];
      }
      groupItemsByShop[shopId].push(item);
    });

    const shopOrders = await Promise.all(
      Object.keys(groupItemsByShop).map(async (shopId) => {
        const shop = await Shop.findById(shopId).populate("owner");

        if (!shop) {
          return res.status(400).json({
            message: "Shop not found",
          });
        }

        const items = groupItemsByShop[shopId];

        const subtotal = items.reduce(
          (sum, i) => sum + Number(i.price) * Number(i.quantity),
          0,
        );

        return {
          shop: shop._id,
          owner: shop.owner._id,
          subtotal,
          shopOrderItems: items.map((i) => ({
            item: i.id,
            price: i.price,
            quantity: i.quantity,
            name: i.name,
          })),
        };
      }),
    );

    if (paymentMethod == "online") {
      const razorOrder = await instance.orders.create({
        amount: Math.round(totalAmount * 100),
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
      });
      const newOrder = await Order.create({
        user: req.userId,
        paymentMethod,
        deliveryAddress,
        totalAmount,
        shopOrders,
        razorpayOrderId: razorOrder.id,
        payment: false,
      });
      return res.status(200).json({
        razorOrder,
        orderId: newOrder._id,
      });
    }

    // if payment method is cod
    const newOrder = await Order.create({
      user: req.userId,
      paymentMethod,
      deliveryAddress,
      totalAmount,
      shopOrders,
    });

    await newOrder.populate(
      "shopOrders.shopOrderItems.item",
      "name image price",
    );
    await newOrder.populate("shopOrders.shop", "name");
    await newOrder.populate("shopOrders.owner", "name socketId");
    await newOrder.populate("user", "name email mobile");

    const io = req.app.get("io");
    if (io) {
      newOrder.shopOrders.forEach((shopOrder) => {
        const ownerSockeId = shopOrder.owner.socketId;
        if (ownerSockeId) {
          io.to(ownerSockeId).emit("newOrder", {
            _id: newOrder._id,
            paymentMethod: newOrder.paymentMethod,
            user: newOrder.user,
            shopOrders: shopOrder,
            createdAt: newOrder.createdAt,
            deliveryAddress: newOrder.deliveryAddress,
            payment: newOrder.payment,
          });
        }
      });
    }

    return res.status(201).json(newOrder);
  } catch (error) {
    return res.status(500).json({
      message: `Place Order error ${error}`,
    });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_payment_id, orderId } = req.body;
    const payment = await instance.payments.fetch(razorpay_payment_id);

    if (!payment || !["authorized", "captured"].includes(payment.status)) {
      return res.status(400).json({
        message: "payment not captured",
      });
    }
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(400).json({
        message: "order not found",
      });
    }

    order.payment = true;
    order.razorpayPaymentId = razorpay_payment_id;
    await order.save();

    await order.populate("shopOrders.shopOrderItems.item", "name image price");
    await order.populate("shopOrders.shop", "name");
    await order.populate("shopOrders.owner", "name socketId");
    await order.populate("user", "name email mobile");

    const io = req.app.get("io");
    if (io) {
      order.shopOrders.forEach((shopOrder) => {
        const ownerSockeId = shopOrder.owner.socketId;
        if (ownerSockeId) {
          io.to(ownerSockeId).emit("newOrder", {
            _id: order._id,
            paymentMethod: order.paymentMethod,
            user: order.user,
            shopOrders: shopOrder,
            createdAt: order.createdAt,
            deliveryAddress: order.deliveryAddress,
            payment: order.payment,
          });
        }
      });
    }

    return res.status(200).json(order);
  } catch (error) {
    return res.status(500).json({
      message: `Verify payment error ${error}`,
    });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.role == "user") {
      const orders = await Order.find({
        user: req.userId,
      })
        .sort({ createdAt: -1 })
        .populate("shopOrders.shop", "name")
        .populate("shopOrders.owner", "name email mobile")
        .populate("shopOrders.shopOrderItems.item", "name image price");

      return res.status(200).json(orders);
    } else if (user.role == "owner") {
      const orders = await Order.find({
        "shopOrders.owner": req.userId,
      })
        .sort({ createdAt: -1 })
        .populate("shopOrders.shop", "name")
        .populate("user")
        .populate("shopOrders.shopOrderItems.item", "name image price")
        .populate("shopOrders.assignedDeliveryBoy", "fullName mobile")
        .populate({
          path: "shopOrders.assignment",
          populate: {
            path: "brodcastedTo",
            select: "fullName mobile",
          },
        });

      const filteredOrders = orders.map((order) => ({
        _id: order._id,
        paymentMethod: order.paymentMethod,
        user: order.user,
        shopOrders: order.shopOrders.find((o) => o.owner._id == req.userId),
        createdAt: order.createdAt,
        deliveryAddress: order.deliveryAddress,
        payment: order.payment,
      }));

      return res.status(200).json(filteredOrders);
    }
  } catch (error) {
    return res.status(500).json({
      message: `Get user Order error ${error}`,
    });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId, shopId } = req.params;
    const { status } = req.body;
    const order = await Order.findById(orderId);

    const shopOrder = order.shopOrders.find((o) => o.shop.toString() == shopId);
    if (!shopOrder) {
      return res.status(400).json({
        message: "Shop order not found",
      });
    }
    shopOrder.status = status;
    let deliveryBoyPayload = [];

    if (status == "out of delivery" && !shopOrder.assignment) {
      const { longitude, latitude } = order.deliveryAddress;
      const nearByDeliveryBoys = await User.find({
        role: "deliveryBoy",
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [Number(longitude), Number(latitude)],
            },
            $maxDistance: 10000, 
          },
        },
      });
      
      const nearByIds = nearByDeliveryBoys.map((b) => b._id);
      const busyIds = await DeliveryAssignment.find({
        assignedTo: { $in: nearByIds },
        status: { $nin: ["brodcasted", "completed"] },
      }).distinct("assignedTo");

      const busyIdSet = new Set(busyIds.map((id) => String(id)));
      const availableBoys = nearByDeliveryBoys.filter(
        (b) => !busyIdSet.has(String(b._id)),
      );

      const candidates = availableBoys.map((b) => b._id);

      if (candidates.length == 0) {
        // DO NOT RETURN HERE, allowed to proceed to save and emit
        // await order.save();
        // return res.json({
        //   message:
        //     "Order status updated but there is no available delivery boys",
        // });
        console.log("No delivery boys available");
      }

      const deliveryAssignment = await DeliveryAssignment.create({
        order: order._id,
        shop: shopOrder.shop,
        shopOrderId: shopOrder._id,
        brodcastedTo: candidates,
        status: "brodcasted",
      });
      shopOrder.assignedDeliveryBoy = deliveryAssignment.assignedTo;

      shopOrder.assignment = deliveryAssignment._id;
      deliveryBoyPayload = availableBoys.map((b) => ({
        id: b._id,
        fullName: b.fullName,
        longitude: b.location.coordinates?.[0],
        latitude: b.location.coordinates?.[1],
        mobile: b.mobile,
      }));

      await deliveryAssignment.populate("order");
      await deliveryAssignment.populate("shop");

      const io = req.app.get("io");
      if (io) {
        availableBoys.forEach((boy) => {
          const boySocketId = boy.socketId;
          if (boySocketId) {
            io.to(boySocketId).emit("newAssignment", {
              sentTo: boy._id,
              assignmentId: deliveryAssignment._id,
              orderId: deliveryAssignment.order._id,
              shopName: deliveryAssignment.shop.name,
              deliveryAddress: deliveryAssignment.order.deliveryAddress,
              items:
                deliveryAssignment.order.shopOrders.find((so) =>
                  so._id.equals(deliveryAssignment.shopOrderId),
                ).shopOrderItems || [],
              subtotal: deliveryAssignment.order.shopOrders.find((so) =>
                so._id.equals(deliveryAssignment.shopOrderId),
              )?.subtotal,
            });
          }
        });
      }
    }

    await order.save();
    const updatedShopOrder = order.shopOrders.find(
      (o) => o.shop.toString() == shopId,
    );
    await order.populate("shopOrders.shop", "name");
    await order.populate(
      "shopOrders.assignedDeliveryBoy",
      "fullName email mobile",
    );
    await order.populate("user", "socketId");

    const assignedBoy = updatedShopOrder.assignedDeliveryBoy
      ? updatedShopOrder.assignedDeliveryBoy
      : null;
    const assignmentId = updatedShopOrder.assignment
      ? updatedShopOrder.assignment._id
      : null;

    // const io = req.app.get("io");
    // if (io) {
    //   const userSocketId = order.user.socketId;
    //   if (userSocketId) {
    //     io.to(userSocketId).emit("update-status", {
    //       orderId: order._id,
    //       // shopId: updatedShopOrder.shop._id,
    //       shopId: updatedShopOrder.shop.toString(),
    //       // status:updateOrderStatus.status,
    //       status: status,
    //       userId: order.user._id,
    //       assignedDeliveryBoy: assignedBoy,
    //     });
    //   }
    // }

    // const io = req.app.get("io");

    // USER ko emit
    // if (order.user?.socketId) {
    //   io.to(order.user.socketId).emit("update-status", {
    //     orderId: order._id,
    //     shopId: updatedShopOrder.shop.toString(),
    //     status,
    //   });
    // }

    // // OWNER ko emit
    // if (updatedShopOrder.owner?.socketId) {
    //   io.to(updatedShopOrder.owner.socketId).emit("update-status", {
    //     orderId: order._id,
    //     shopId: updatedShopOrder.shop.toString(),
    //     status,
    //   });
    // }

    await order.populate("shopOrders.owner", "socketId");
    await order.populate("user", "socketId");

    const io = req.app.get("io");

if (io) {
      const payload = {
        orderId: order._id,
        shopId: shopId, // Use the string ID from params directly
        status,
      };

      // USER
      if (order.user?.socketId) {
        io.to(order.user.socketId).emit("update-status", payload);
      }

      // OWNER
      if (updatedShopOrder.owner?.socketId) {
        io.to(updatedShopOrder.owner.socketId).emit("update-status", payload);
      }
    }


    return res.status(200).json({
      shopOrder: updatedShopOrder,
      // assignedDeliveryBoy: updatedShopOrder?.assignedDeliveryBoy,
      assignedDeliveryBoy: assignedBoy,
      availableBoys: deliveryBoyPayload,
      // assignment: updatedShopOrder?.assignment._id,
      assignment: assignmentId,
    });
  } catch (error) {
    return res.status(500).json({
      message: `Order Status error ${error}`,
    });
  }
};

export const getDeliveryBoyAssignment = async (req, res) => {
  try {
    const deliveryBoyId = req.userId;
    const assignments = await DeliveryAssignment.find({
      brodcastedTo: deliveryBoyId,
      status: "brodcasted",
    })
      .populate("order")
      .populate("shop");

    const formatted = assignments.map((a) => ({
      assignmentId: a._id,
      orderId: a.order._id,
      shopName: a.shop.name,
      deliveryAddress: a.order.deliveryAddress,
      items:
        a.order.shopOrders.find((so) => so._id.equals(a.shopOrderId))
          ?.shopOrderItems || [],
      subtotal: a.order.shopOrders.find((so) => so._id.equals(a.shopOrderId))
        ?.subtotal,
    }));

    return res.status(200).json(formatted);
  } catch (error) {
    return res.status(500).json({
      message: `Get assignment error ${error}`,
    });
  }
};

export const acceptOrder = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const assignment = await DeliveryAssignment.findById(assignmentId);
    if (!assignment) {
      return res.status(400).json({
        message: "Assignment not found",
      });
    }
    if (assignment.status !== "brodcasted") {
      return res.status(400).json({
        message: "Assignment is expired",
      });
    }

    const alreadyAssigned = await DeliveryAssignment.findOne({
      assignedTo: req.userId,
      status: { $nin: ["brodcasted", "completed"] },
    });

    if (alreadyAssigned) {
      return res.status(400).json({
        message: "You are already assigned to another order",
      });
    }

    assignment.assignedTo = req.userId;
    assignment.status = "assigned";
    assignment.acceptedAt = new Date();
    await assignment.save();

    const order = await Order.findById(assignment.order);
    if (!order) {
      return res.status(400).json({
        message: "Order not found",
      });
    }

    const shopOrder = order.shopOrders.id(assignment.shopOrderId);
    shopOrder.assignedDeliveryBoy = req.userId;

    await order.save();
    
    // Notify Owner and User
    await order.populate("shopOrders.owner", "socketId");
    await order.populate("user", "socketId");
    await order.populate("shopOrders.assignedDeliveryBoy", "fullName mobile");

    const io = req.app.get("io");
    if(io){
        const payload = {
            orderId: order._id,
            shopId: shopOrder.shop.toString(),
            status: "assigned", // or keep previous status but add assignment info
            assignedDeliveryBoy: shopOrder.assignedDeliveryBoy
        }

        // To Owner
        if(order.shopOrders.find(so => so._id.equals(shopOrder._id))?.owner?.socketId){
             io.to(order.shopOrders.find(so => so._id.equals(shopOrder._id)).owner.socketId).emit('update-status', payload)
        }

        // To User (optional, if they need to see delivery boy name)
        if(order.user?.socketId){
            io.to(order.user.socketId).emit('update-status', payload)
        }
    }

    return res.status(200).json({
      message: "Order accepted",
    });
  } catch (error) {
    return res.status(500).json({
      message: `Accept Order error ${error}`,
    });
  }
};

export const getCurrentOrder = async (req, res) => {
  try {
    const assignment = await DeliveryAssignment.findOne({
      assignedTo: req.userId,
      status: "assigned",
    })
      .populate("shop", "name")
      .populate("assignedTo", "fullName email mobile location")
      .populate({
        path: "order",
        populate: [
          {
            path: "user",
            select: "fullName email location mobile",
          },
        ],
      });

    if (!assignment) {
      return res.status(400).json({
        message: "assignment not found",
      });
    }

    if (!assignment.order) {
      return res.status(400).json({
        message: "order not found",
      });
    }

    const shopOrder = assignment.order.shopOrders.find(
      (so) => String(so._id) == String(assignment.shopOrderId),
    );
    if (!shopOrder) {
      return res.status(400).json({
        message: "shop order not found",
      });
    }

    let deliveryBoyLocation = { lat: null, lon: null };
    if (assignment.assignedTo.location.coordinates.length == 2) {
      deliveryBoyLocation.lat = assignment.assignedTo.location.coordinates[1];
      deliveryBoyLocation.lon = assignment.assignedTo.location.coordinates[0];
    }

    let customerLocation = { lat: null, lon: null };
    if (assignment.order.deliveryAddress) {
      customerLocation.lat = assignment.order.deliveryAddress.latitude;
      customerLocation.lon = assignment.order.deliveryAddress.longitude;
    }

    return res.status(200).json({
      _id: assignment.order._id,
      user: assignment.order.user,
      shopOrder,
      deliveryAddress: assignment.order.deliveryAddress,
      deliveryBoyLocation,
      customerLocation,
    });
  } catch (error) {
    return res.status(500).json({
      message: `Get current order error ${error}`,
    });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId)
      .populate("user")
      .populate({
        path: "shopOrders.shop",
        model: "Shop",
      })
      .populate({
        path: "shopOrders.assignedDeliveryBoy",
        model: "User",
      })
      .populate({
        path: "shopOrders.shopOrderItems.item",
        model: "Item",
      })
      .lean();

    if (!order) {
      return res.status(400).json({
        message: "order not found",
      });
    }

    return res.status(200).json(order);
  } catch (error) {
    return res.status(500).json({
      message: `Get order by id error ${error}`,
    });
  }
};

export const sendDeliveryOtp = async (req, res) => {
  try {
    const { orderId, shopOrderId } = req.body;
    const order = await Order.findById(orderId).populate("user");

    const shopOrder = order.shopOrders.id(shopOrderId);

    if (!order || !shopOrder) {
      return res.status().json({
        message: "enter valid order/shop order id",
      });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    shopOrder.deliveryOtp = otp;
    shopOrder.otpExpires = Date.now() + 5 * 60 * 1000;
    await order.save();
    await sendDeliveryOtpMail(order.user, otp);
    return res.status(200).json({
      message: `OTP sent successfully to ${order?.user?.fullName}`,
    });
  } catch (error) {
    return res.status(500).json({
      message: `send delivery otp error ${error}`,
    });
  }
};

export const verifyDeliveryOtp = async (req, res) => {
  try {
    const { orderId, shopOrderId, otp } = req.body;
    const order = await Order.findById(orderId).populate("user");

    const shopOrder = order.shopOrders.id(shopOrderId);

    if (!order || !shopOrder) {
      return res.status().json({
        message: "enter valid order/shop order id",
      });
    }

    if (
      shopOrder.deliveryOtp !== otp ||
      !shopOrder.otpExpires ||
      shopOrder.otpExpires < Date.now()
    ) {
      return res.status(400).json({
        message: "Invalid/Expired OTP",
      });
    }

    shopOrder.status = "delivered";
    shopOrder.deliveredAt = Date.now();
    await order.save();
    await DeliveryAssignment.deleteOne({
      shopOrderId: shopOrder._id,
      order: order._id,
      assignedTo: shopOrder.assignedDeliveryBoy,
    });

    // Notify User and Owner about delivery
    const io = req.app.get("io");
    if(io){
        const payload = {
            orderId: order._id,
            shopId: shopOrder.shop.toString(),
            status: "delivered",
        }

        // To User
        if(order.user?.socketId){
             io.to(order.user.socketId).emit('update-status', payload)
        }
        
        // To Owner
        // Need to populate owner to get socketId if not already populated
        await order.populate("shopOrders.owner", "socketId");
        if(order.shopOrders.find(so => so._id.equals(shopOrder._id))?.owner?.socketId){
             io.to(order.shopOrders.find(so => so._id.equals(shopOrder._id)).owner.socketId).emit('update-status', payload)
        }
    }

    return res.status(200).json({
      message: "Order Delivered Successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: `verify otp error ${error}`,
    });
  }
};

export const getTodayDeliveries = async (req, res) => {
  try {
    const deliveryBoyId = req.userId;
    const startsOfDay = new Date();
    startsOfDay.setHours(0, 0, 0, 0);

    const orders = await Order.find({
      "shopOrders.assignedDeliveryBoy": deliveryBoyId,
      "shopOrders.status": "delivered",
      "shopOrders.deliveredAt": { $gte: startsOfDay },
    }).lean();

    let todaysDeliveries = [];
    orders.forEach((order) => {
      order.shopOrders.forEach((shopOrder) => {
        if (
          shopOrder.assignedDeliveryBoy == deliveryBoyId &&
          shopOrder.status == "delivered" &&
          shopOrder.deliveredAt &&
          shopOrder.deliveredAt >= startsOfDay
        ) {
          todaysDeliveries.push(shopOrder);
        }
      });
    });

    let stats = {};
    todaysDeliveries.forEach((shopOrder) => {
      const hour = new Date(shopOrder.deliveredAt).getHours();
      stats[hour] = (stats[hour] || 0) + 1;
    });

    let formattedStats = Object.keys(stats).map((hour) => ({
      hour: parseInt(hour),
      count: stats[hour],
    }));

    formattedStats.sort((a, b) => a.hour - b.hour);

    return res.status(200).json(formattedStats);
  } catch (error) {
    return res.status(500).json({
      message: `Todays deliveries error ${error}`,
    });
  }
};
