const crypto = require("crypto");
const https = require("https");
const querystring = require("querystring");
const { Payment, User } = require("../models");

const sortObject = (obj) => {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
};

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
};

const createMoMoPayment = async (payment) => {
  const accessKey = process.env.MOMO_ACCESS_KEY;
  const secretKey = process.env.MOMO_SECRET_KEY;
  const partnerCode = process.env.MOMO_PARTNER_CODE;
  const redirectUrl = process.env.MOMO_RETURN_URL;
  const ipnUrl = process.env.MOMO_NOTIFY_URL;

  const orderId = payment.transactionId;
  const requestId = orderId;
  const amount = payment.amount.toString();
  const orderInfo = payment.description || "Payment for subscription";
  const extraData = JSON.stringify({
    paymentId: payment._id.toString(),
    userId: payment.userId.toString(),
  });
  const lang = "vi";
  const autoCapture = true;
  const orderGroupId = "";
  const requestType = "payWithMethod";

  const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(rawSignature)
    .digest("hex");

  const requestBody = {
    partnerCode,
    partnerName: "Job Event Platform",
    storeId: "JobEventStore",
    requestId,
    amount,
    orderId,
    orderInfo,
    redirectUrl,
    ipnUrl,
    lang,
    requestType,
    autoCapture,
    extraData,
    orderGroupId,
    signature,
  };

  return new Promise((resolve, reject) => {
    const requestBodyString = JSON.stringify(requestBody);

    const options = {
      hostname: "test-payment.momo.vn",
      port: 443,
      path: "/v2/gateway/api/create",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(requestBodyString),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.write(requestBodyString);
    req.end();
  });
};

const createVNPayPayment = async (payment, ipAddr = "127.0.0.1") => {
  const vnp_TmnCode = process.env.VNPAY_TMN_CODE;
  const vnp_HashSecret = process.env.VNPAY_HASH_SECRET;
  const vnp_Url = process.env.VNPAY_URL;
  const vnp_ReturnUrl = process.env.VNPAY_RETURN_URL;

  const createDate = formatDate(new Date());
  const orderId = payment.transactionId;

  const expireDate = new Date();
  expireDate.setMinutes(expireDate.getMinutes() + 10);
  const vnp_ExpireDate = formatDate(expireDate);

  let vnp_Params = {};
  vnp_Params["vnp_Version"] = "2.1.0";
  vnp_Params["vnp_Command"] = "pay";
  vnp_Params["vnp_TmnCode"] = vnp_TmnCode;
  vnp_Params["vnp_Locale"] = "vn";
  vnp_Params["vnp_CurrCode"] = "VND";
  vnp_Params["vnp_TxnRef"] = orderId;
  vnp_Params["vnp_OrderInfo"] =
    payment.description || "Thanh toan cho ma GD:" + orderId;
  vnp_Params["vnp_OrderType"] = "other";
  vnp_Params["vnp_Amount"] = payment.amount * 100;
  vnp_Params["vnp_ReturnUrl"] = vnp_ReturnUrl;
  vnp_Params["vnp_IpAddr"] = ipAddr;
  vnp_Params["vnp_CreateDate"] = createDate;
  vnp_Params["vnp_ExpireDate"] = vnp_ExpireDate;

  vnp_Params = sortObject(vnp_Params);

  const qs = require("qs");
  const signData = qs.stringify(vnp_Params, { encode: false });
  const hmac = crypto.createHmac("sha512", vnp_HashSecret);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
  vnp_Params["vnp_SecureHash"] = signed;

  const paymentUrl = vnp_Url + "?" + qs.stringify(vnp_Params, { encode: false });

  return { paymentUrl };
};

// @desc    Get user's payment history
// @route   GET /api/payments
// @access  Private
exports.getPayments = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = { userId: req.user._id };
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments(query);

    res.status(200).json({
      success: true,
      count: payments.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: payments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get payment by transaction ID
// @route   GET /api/payments/transaction/:transactionId
// @access  Private
exports.getPaymentByTransactionId = async (req, res, next) => {
  try {
    const { transactionId } = req.params;

    const payment = await Payment.findOne({
      transactionId,
      userId: req.user._id,
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    VNPay return URL handler (VNPAY standard)
// @route   GET /api/payments/vnpay/return
// @access  Public
exports.vnpayReturn = async (req, res, next) => {
  try {
    let vnp_Params = req.query;
    const secureHash = vnp_Params["vnp_SecureHash"];

    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    vnp_Params = sortObject(vnp_Params);

    const vnp_HashSecret = process.env.VNPAY_HASH_SECRET;
    const qs = require("qs");
    const signData = qs.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    const frontendUrl = process.env.CORS_ORIGIN || "http://localhost:3000";

    if (secureHash === signed) {
      const orderId = req.query["vnp_TxnRef"];
      const rspCode = req.query["vnp_ResponseCode"];

      const payment = await Payment.findOne({ transactionId: orderId });

      if (payment) {
        if (rspCode === "00") {
          payment.status = "SUCCESS";
          payment.metadata = {
            ...payment.metadata,
            vnpayTransactionNo: req.query["vnp_TransactionNo"],
            vnpayBankCode: req.query["vnp_BankCode"],
            vnpayCardType: req.query["vnp_CardType"],
          };
          await payment.save();

          if (payment.subscriptionData && payment.subscriptionData.plan) {
            const user = await User.findById(payment.userId);

            if (user) {
              const expiryDate = new Date();
              expiryDate.setDate(
                expiryDate.getDate() + payment.subscriptionData.duration,
              );

              user.subscription.plan = payment.subscriptionData.plan;
              user.subscription.expiredAt = expiryDate;
              user.subscription.urgentUsed = 0;
              user.subscription.postUsed = 0;

              await user.save();
            }
          }

          return res.redirect(
            `${frontendUrl}/payment-success?orderId=${orderId}`,
          );
        } else {
          payment.status = "FAILED";
          payment.metadata = {
            ...payment.metadata,
            vnpayResponseCode: rspCode,
          };
          await payment.save();

          return res.redirect(`${frontendUrl}/payment-failed?code=${rspCode}`);
        }
      } else {
        console.error("VNPay: Payment not found:", orderId);
        return res.redirect(`${frontendUrl}/payment-error?reason=not_found`);
      }
    } else {
      console.error("VNPay: Invalid signature");
      return res.redirect(
        `${frontendUrl}/payment-error?reason=invalid_signature`,
      );
    }
  } catch (error) {
    console.error("VNPay Return Error:", error);
    const frontendUrl = process.env.CORS_ORIGIN || "http://localhost:3000";
    res.redirect(`${frontendUrl}/payment-error?reason=server_error`);
  }
};

// @desc    VNPay IPN callback (VNPAY standard)
// @route   GET /api/payments/vnpay/notify
// @access  Public
exports.vnpayNotify = async (req, res, next) => {
  try {
    let vnp_Params = req.query;
    const secureHash = vnp_Params["vnp_SecureHash"];

    const orderId = vnp_Params["vnp_TxnRef"];
    const rspCode = vnp_Params["vnp_ResponseCode"];

    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    vnp_Params = sortObject(vnp_Params);
    const vnp_HashSecret = process.env.VNPAY_HASH_SECRET;
    const qs = require("qs");
    const signData = qs.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    if (secureHash === signed) {
      const payment = await Payment.findOne({ transactionId: orderId });

      if (!payment) {
        console.error("VNPay IPN: Order not found:", orderId);
        return res.status(200).json({ RspCode: "01", Message: "Order not found" });
      }

      const checkAmount = true; 

      if (checkAmount) {
        if (payment.status === "PENDING") {
          if (rspCode === "00") {
            payment.status = "SUCCESS";
            payment.metadata = {
              ...payment.metadata,
              vnpayTransactionNo: req.query["vnp_TransactionNo"],
              vnpayBankCode: req.query["vnp_BankCode"],
              vnpayCardType: req.query["vnp_CardType"],
            };
            await payment.save();

            if (payment.subscriptionData && payment.subscriptionData.plan) {
              const user = await User.findById(payment.userId);

              if (user) {
                const expiryDate = new Date();
                expiryDate.setDate(
                  expiryDate.getDate() + payment.subscriptionData.duration,
                );

                user.subscription.plan = payment.subscriptionData.plan;
                user.subscription.expiredAt = expiryDate;
                user.subscription.urgentUsed = 0;
                user.subscription.postUsed = 0;

                await user.save();
              }
            }

            return res.status(200).json({ RspCode: "00", Message: "Success" });
          } else {
            payment.status = "FAILED";
            payment.metadata = {
              ...payment.metadata,
              vnpayResponseCode: rspCode,
            };
            await payment.save();

            return res.status(200).json({ RspCode: "00", Message: "Success" });
          }
        } else {
          return res.status(200).json({
            RspCode: "02",
            Message: "This order has been updated to the payment status",
          });
        }
      } else {
        return res
          .status(200)
          .json({ RspCode: "04", Message: "Amount invalid" });
      }
    } else {
      console.error("VNPay IPN: Checksum failed");
      return res
        .status(200)
        .json({ RspCode: "97", Message: "Checksum failed" });
    }
  } catch (error) {
    console.error("VNPay IPN Error:", error);
    return res.status(200).json({ RspCode: "99", Message: "Unknown error" });
  }
};

// @desc    MoMo return URL handler
// @route   GET /api/payments/momo/return
// @access  Public
exports.momoReturn = async (req, res, next) => {
  try {
    const {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData,
      signature,
    } = req.query;

    const frontendUrl = process.env.CORS_ORIGIN || "http://localhost:3000";

    const secretKey = process.env.MOMO_SECRET_KEY;
    const accessKey = process.env.MOMO_ACCESS_KEY;

    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

    const expectedSignature = crypto
      .createHmac("sha256", secretKey)
      .update(rawSignature)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.error("MoMo Return: Invalid signature");
      return res.redirect(
        `${frontendUrl}/payment-error?reason=invalid_signature`,
      );
    }

    const payment = await Payment.findOne({ transactionId: orderId });

    if (!payment) {
      console.error("MoMo Return: Payment not found:", orderId);
      return res.redirect(`${frontendUrl}/payment-error?reason=not_found`);
    }

    if (resultCode === "0") {
      payment.status = "SUCCESS";
      payment.metadata = {
        ...payment.metadata,
        momoTransId: transId,
        payType,
        responseTime,
      };
      await payment.save();

      if (payment.subscriptionData && payment.subscriptionData.plan) {
        const user = await User.findById(payment.userId);

        if (user) {
          const expiryDate = new Date();
          expiryDate.setDate(
            expiryDate.getDate() + payment.subscriptionData.duration,
          );

          user.subscription.plan = payment.subscriptionData.plan;
          user.subscription.expiredAt = expiryDate;
          user.subscription.urgentUsed = 0;
          user.subscription.postUsed = 0;

          await user.save();
        }
      }
      return res.redirect(
        `${frontendUrl}/payment-success?orderId=${orderId}&transId=${transId}`,
      );
    } else {
      payment.status = "FAILED";
      payment.metadata = {
        ...payment.metadata,
        errorMessage: message,
        resultCode,
      };
      await payment.save();

      return res.redirect(
        `${frontendUrl}/payment-failed?message=${encodeURIComponent(message)}&code=${resultCode}`,
      );
    }
  } catch (error) {
    console.error("MoMo Return Error:", error);
    const frontendUrl = process.env.CORS_ORIGIN || "http://localhost:3000";
    res.redirect(`${frontendUrl}/payment-error?reason=server_error`);
  }
};

// @desc    VNPay IPN callback (VNPAY standard)
// @route   GET /api/payments/vnpay/notify
// @access  Public
exports.vnpayNotify = async (req, res, next) => {
  try {
    let vnp_Params = req.query;
    const secureHash = vnp_Params["vnp_SecureHash"];

    const orderId = vnp_Params["vnp_TxnRef"];
    const rspCode = vnp_Params["vnp_ResponseCode"];

    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    vnp_Params = sortObject(vnp_Params);
    const vnp_HashSecret = process.env.VNPAY_HASH_SECRET;
    const qs = require("qs");
    const signData = qs.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    if (secureHash === signed) {
      const payment = await Payment.findOne({ transactionId: orderId });

      if (!payment) {
        console.error("VNPay IPN: Order not found:", orderId);
        return res.status(200).json({ RspCode: "01", Message: "Order not found" });
      }

      const checkAmount = true; 

      if (checkAmount) {
        if (payment.status === "PENDING") {
          if (rspCode === "00") {
            payment.status = "SUCCESS";
            payment.metadata = {
              ...payment.metadata,
              vnpayTransactionNo: req.query["vnp_TransactionNo"],
              vnpayBankCode: req.query["vnp_BankCode"],
              vnpayCardType: req.query["vnp_CardType"],
            };
            await payment.save();

            if (payment.subscriptionData && payment.subscriptionData.plan) {
              const user = await User.findById(payment.userId);

              if (user) {
                const expiryDate = new Date();
                expiryDate.setDate(
                  expiryDate.getDate() + payment.subscriptionData.duration,
                );

                user.subscription.plan = payment.subscriptionData.plan;
                user.subscription.expiredAt = expiryDate;
                user.subscription.urgentUsed = 0;
                user.subscription.postUsed = 0;

                await user.save();
              }
            }

            return res.status(200).json({ RspCode: "00", Message: "Success" });
          } else {
            payment.status = "FAILED";
            payment.metadata = {
              ...payment.metadata,
              vnpayResponseCode: rspCode,
            };
            await payment.save();

            return res.status(200).json({ RspCode: "00", Message: "Success" });
          }
        } else {
          return res.status(200).json({
            RspCode: "02",
            Message: "This order has been updated to the payment status",
          });
        }
      } else {
        return res
          .status(200)
          .json({ RspCode: "04", Message: "Amount invalid" });
      }
    } else {
      console.error("VNPay IPN: Checksum failed");
      return res
        .status(200)
        .json({ RspCode: "97", Message: "Checksum failed" });
    }
  } catch (error) {
    console.error("VNPay IPN Error:", error);
    return res.status(200).json({ RspCode: "99", Message: "Unknown error" });
  }
};

// @desc    Momo IPN callback
// @route   POST /api/payments/momo/notify
// @access  Public
exports.momoNotify = async (req, res, next) => {
  try {
    const {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData,
      signature,
    } = req.body;

    const secretKey = process.env.MOMO_SECRET_KEY;
    const rawSignature = `accessKey=${process.env.MOMO_ACCESS_KEY}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

    const expectedSignature = crypto
      .createHmac("sha256", secretKey)
      .update(rawSignature)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.error("Invalid MoMo signature");
      return res.status(400).json({
        success: false,
        message: "Invalid signature",
      });
    }

    const payment = await Payment.findOne({ transactionId: orderId });

    if (!payment) {
      console.error("Payment not found:", orderId);
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    if (resultCode === 0) {
      payment.status = "SUCCESS";
      payment.metadata = {
        ...payment.metadata,
        momoTransId: transId,
        payType,
        responseTime,
      };
      await payment.save();

      if (payment.subscriptionData && payment.subscriptionData.plan) {
        const user = await User.findById(payment.userId);

        if (user) {
          const expiryDate = new Date();
          expiryDate.setDate(
            expiryDate.getDate() + payment.subscriptionData.duration,
          );

          user.subscription.plan = payment.subscriptionData.plan;
          user.subscription.expiredAt = expiryDate;
          user.subscription.urgentUsed = 0;
          user.subscription.postUsed = 0;

          await user.save();
        }
      }
    } else {
      payment.status = "FAILED";
      payment.metadata = {
        ...payment.metadata,
        errorMessage: message,
        resultCode,
      };
      await payment.save();
    }

    res.status(200).json({
      success: true,
      message: "Notification received",
    });
  } catch (error) {
    console.error("MoMo Notify Error:", error);
    next(error);
  }
};
